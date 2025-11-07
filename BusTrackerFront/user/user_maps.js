import { 
  apiGet, 
  REF_POINTS, 
  REF_BOUNDS, 
  ROUTE1_COORDS, 
  UTC_RAMOS, 
  ARRIVAL_RADIUS_M,
  BUS_ICON_URL, BUS_ICON_SIZE, BUS_ICON_ANCHOR, BUS_POPUP_ANCHOR, BUS_SHADOW_URL, BUS_SHADOW_SIZE, BUS_SHADOW_ANCHOR
} from '../shared/api.js'

const busIcon = L.icon({
  iconUrl: BUS_ICON_URL,
  iconSize: BUS_ICON_SIZE,
  iconAnchor: BUS_ICON_ANCHOR,
  popupAnchor: BUS_POPUP_ANCHOR,
  shadowUrl: BUS_SHADOW_URL,
  shadowSize: BUS_SHADOW_SIZE,
  shadowAnchor: BUS_SHADOW_ANCHOR,
})

// Crea un mapa por ruta y hace polling cada 10 s a /rutas/{id}/location
window.createRouteMap = function ({ routeId, host }) {
  const container = document.createElement('div')
  container.className = 'card rounded-2xl overflow-hidden'
  const headerId = `hdr-${routeId}`
  const mapId = `map-${routeId}`
  const errId = `err-${routeId}`
  container.innerHTML = `
<div id="${headerId}" class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
<div class="flex items-center gap-3">
<strong class="text-sm">Ruta #${routeId}</strong>
<span id="status-${routeId}" class="badge off"><span class="pulse-dot" style="background:#9ca3af"></span>Inactiva</span>
</div>
<button class="btn ghost close-map-btn">Cerrar mapa</button>
</div>
<div id="${mapId}" class="map"></div>
<div id="${errId}" class="px-4 py-2 text-sm text-red-600 hidden"></div>
`
  let map, marker, polyline, path = []


  function initMap() {
    map = L.map(mapId, { zoomControl: true }).fitBounds(REF_BOUNDS, { padding: [40, 40] })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map)


    // Polilínea de la Ruta 1 (PRI Saltillo → UTC Ramos Arizpe)
    if (Number(routeId) === 1) {
      L.polyline(ROUTE1_COORDS, { weight: 5, opacity: 0.9 }).addTo(map)
      map.fitBounds(L.polyline(ROUTE1_COORDS).getBounds(), { padding: [40, 40] })
      L.marker(ROUTE1_COORDS[0]).addTo(map).bindPopup('Inicio: PRI Estatal (Saltillo)')
      L.marker(UTC_RAMOS).addTo(map).bindPopup('Destino: UTC Ramos Arizpe')
      L.circle(UTC_RAMOS, { radius: ARRIVAL_RADIUS_M, color: '#16a34a', fillOpacity: 0.06 }).addTo(map)
    }

    // Referencias
    L.circleMarker(REF_POINTS.saltillo.coords, { radius: 6, color: '#1e3a8a' }).addTo(map).bindPopup('Saltillo')
    L.circleMarker(REF_POINTS.ramos.coords, { radius: 6, color: '#16a34a' }).addTo(map).bindPopup('Ramos Arizpe')


    polyline = L.polyline(path, { weight: 3, dashArray: '4 6' }).addTo(map)
  }

  async function tick() {
    try {
      const data = await apiGet(`/rutas/${routeId}/location`)
      const errEl = document.getElementById(`${errId}`)
      errEl.classList.add('hidden')


      const statusEl = document.getElementById(`status-${routeId}`)
      if (statusEl) {
        const statusVal = (data.status !== undefined) ? data.status : (data.activo ? 1 : 0)
        const on = Number(statusVal) === 1
        statusEl.className = 'badge ' + (on ? 'on' : 'off')
        statusEl.innerHTML = `<span class="pulse-dot" style="background:${on ? '#16a34a' : '#9ca3af'}"></span>${on ? 'Activa' : 'Inactiva'}`
      }


      const lat = (data.lat !== undefined) ? data.lat : (data.latitude ?? null)
      const lng = (data.long !== undefined) ? data.long : (data.lng ?? data.longitude ?? null)


      if (lat != null && lng != null) {
        const next = [Number(lat), Number(lng)]
        const last = path[path.length - 1]
        if (!last || last[0] !== next[0] || last[1] !== next[1]) {
          path.push(next)
          if (path.length > 600) path.shift()
          polyline.setLatLngs(path)
          if (!marker) { marker = L.marker(next, {icon: busIcon}).addTo(map) } else { marker.setLatLng(next).setIcon(busIcon) }
          map.setView(next)
        }
      }
    } catch (e) {
      const errEl = document.getElementById(`${errId}`)
      errEl.textContent = e && e.message ? e.message : 'No se pudo obtener la ubicación'
      errEl.classList.remove('hidden')
    }
  }
  function mount() {
    host.appendChild(container)
    const closeBtn = container.querySelector('.close-map-btn')
    initMap()
    const onClose = () => { if (map) map.remove(); container.remove() }
    closeBtn.addEventListener('click', onClose)
    return onClose
  }
  function startPolling() {
    const id = setInterval(tick, 10000) // ⏱️ 10 s para seguir la ruta
    tick()
    return id
  }


  return { mount, startPolling }
}