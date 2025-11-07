import { apiPost, 
  REF_BOUNDS, 
  REF_POINTS, 
  UTC_RAMOS, 
  ARRIVAL_RADIUS_M,
  BUS_ICON_URL, 
  BUS_ICON_SIZE, 
  BUS_ICON_ANCHOR, 
  BUS_POPUP_ANCHOR, 
  BUS_SHADOW_URL, BUS_SHADOW_SIZE, BUS_SHADOW_ANCHOR } from '../shared/api.js'


const idRutaEl = document.getElementById('id_ruta')
const unidadEl = document.getElementById('unidad')
const btnStart = document.getElementById('btn-start')
const btnStop = document.getElementById('btn-stop')
const btnCancel = document.getElementById('btn-cancel')
const btnPing = document.getElementById('btn-ping')
const latEl = document.getElementById('lat')
const lngEl = document.getElementById('lng')
const sentEl = document.getElementById('sent')
const msgEl = document.getElementById('msg')
const errEl = document.getElementById('err')

const busIcon = L.icon({
  iconUrl: BUS_ICON_URL,
  iconSize: BUS_ICON_SIZE,
  iconAnchor: BUS_ICON_ANCHOR,
  popupAnchor: BUS_POPUP_ANCHOR,
  shadowUrl: BUS_SHADOW_URL,
  shadowSize: BUS_SHADOW_SIZE,
  shadowAnchor: BUS_SHADOW_ANCHOR,
})

let watchId = null
let map, marker
let lastSentAt = 0 // ⏱️ throttle: enviamos como máx. cada 10 s

function setMsg(m) { msgEl.textContent = m || '' }
function setErr(m) { errEl.textContent = m || '' }

function getIds() {
  const id_ruta = Number(idRutaEl.value)
  const unidad = Number(unidadEl.value)
  return { id_ruta, unidad }
}

function ensureIds() {
  const { id_ruta, unidad } = getIds()
  if (!id_ruta || !unidad) { setErr('Ingresa id_ruta y unidad'); return null }
  return { id_ruta, unidad }
}

// Haversine (metros)
function distMeters(aLat, aLng, bLat, bLng) {
  const toRad = (d) => d * Math.PI / 180
  const R = 6371000
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2)
  const aa = s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2
  return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}
async function maybeAutoCancel(id_ruta, lat, lng) {
  const d = distMeters(lat, lng, UTC_RAMOS[0], UTC_RAMOS[1])
  //Auto-cancel al entrar al radio de llegada
  if (d <= ARRIVAL_RADIUS_M) {
    try {
      await apiPost('/rutas/cancel', { id_ruta })
      setMsg(`Llegaste a la UTC (~${Math.round(d)} m). Viaje finalizado (status=0).`)
      if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null }
      btnStart.disabled = false
      btnStop.disabled = true
    } catch (e) { setErr(e && e.message ? e.message : 'Error al auto-cancelar en llegada') }
  }
}
async function postStart(lat, lng) {
  const ids = ensureIds(); if (!ids) return
  try {
    await apiPost('/rutas/start', { id_ruta: ids.id_ruta, lat, long: lng, unidad: ids.unidad })
    setMsg('Tracking enviado')
    setErr('')
    const count = Number(sentEl.textContent || '0') + 1
    sentEl.textContent = String(count)
    latEl.textContent = lat.toFixed(6)
    lngEl.textContent = lng.toFixed(6)


    if (!marker) { marker = L.marker([lat, lng]), {icon: busIcon}.addTo(map) } else { marker.setLatLng([lat, lng]).setIcon(busIcon) }
    map.setView([lat, lng])


    //Revisa llegada a UTC y cancela automáticamente si corresponde
    await maybeAutoCancel(ids.id_ruta, lat, lng)
  } catch (e) {
    setErr(e && e.message ? e.message : 'Error enviando tracking')
  }
}

// Mapa con referencias y zona de llegada
function initMap() {
  map = L.map('map').fitBounds(REF_BOUNDS, { padding: [40, 40] })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map)


  // Puntos de referencia (Saltillo y Ramos Arizpe)
  L.circleMarker(REF_POINTS.saltillo.coords, { radius: 6, color: '#1e3a8a' }).addTo(map).bindPopup('Saltillo')
  L.circleMarker(REF_POINTS.ramos.coords, { radius: 6, color: '#16a34a' }).addTo(map).bindPopup('Ramos Arizpe')


  // Zona de llegada a UTC
  L.circle(UTC_RAMOS, { radius: ARRIVAL_RADIUS_M, color: '#16a34a', fillOpacity: 0.08 }).addTo(map).bindPopup('Meta: UTC Ramos Arizpe')
}
initMap()

btnPing.addEventListener('click', () => {
  if (!('geolocation' in navigator)) { setErr('El navegador no soporta Geolocalización'); return }
  setMsg('Obteniendo GPS...'); setErr('')
  navigator.geolocation.getCurrentPosition(
    (pos) => { postStart(pos.coords.latitude, pos.coords.longitude) },
    (e) => setErr(e && e.message ? e.message : 'Error de GPS'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
})

btnStart.addEventListener('click', () => {
  const ids = ensureIds(); if (!ids) return
  if (!('geolocation' in navigator)) { setErr('El navegador no soporta Geolocalización'); return }
  setErr(''); setMsg('Tracking en vivo iniciado (cada ~10 s)')
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const now = Date.now()
      if (now - lastSentAt < 10000) return // ⏱️ 10 s
      lastSentAt = now
      postStart(pos.coords.latitude, pos.coords.longitude)
    },
    (e) => setErr(e && e.message ? e.message : 'Error de GPS'),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  )
  btnStart.disabled = true
  btnStop.disabled = false
})
btnStop.addEventListener('click', () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
    setMsg('Tracking en vivo detenido (no cancela el viaje)')
    btnStart.disabled = false
    btnStop.disabled = true
  }
})
btnCancel.addEventListener('click', async () => {
  const ids = ensureIds(); if (!ids) return
  setErr(''); setMsg('Cancelando...')
  try {
    await apiPost('/rutas/cancel', { id_ruta: ids.id_ruta })
    setMsg('Viaje cancelado (status=0)')
    if (watchId !== null) { navigator.globals?.clearWatch?.(watchId); navigator.geolocation.clearWatch(watchId); watchId = null }
    btnStart.disabled = false
    btnStop.disabled = true
  } catch (e) {
    setErr(e && e.message ? e.message : 'Error al cancelar')
  }
})