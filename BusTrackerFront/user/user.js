// user/user.js
import { apiGet } from '../shared/api.js'
import './user_maps.js'

const grid = document.getElementById('routes-grid')
const mapsHost = document.getElementById('maps-host')
const toggleAllEl = document.getElementById('toggle-all')
const btnRefresh = document.getElementById('btn-refresh')

let rutas = []
let showAll = false
let openMaps = new Map() // id_ruta -> { intervalId, destroy: fn }

toggleAllEl.addEventListener('change', () => {
  showAll = !!toggleAllEl.checked
  renderGrid()
})

btnRefresh.addEventListener('click', () => loadRoutes())

async function loadRoutes() {
  try {
    const data = await apiGet('/rutas')
    rutas = Array.isArray(data) ? data : []
    renderGrid()
  } catch (e) {
    grid.innerHTML = `<div class="text-red-600 text-sm">Error: ${e.message || 'No se pudo cargar /rutas'}</div>`
  }
}

function statusBadge(status) {
  const on = status === 1
  return `<span class="badge ${on ? 'on' : 'off'}"><span class="pulse-dot" style="background:${on ? '#16a34a' : '#9ca3af'}"></span>${on ? 'Activa' : 'Inactiva'}</span>`
}

function routeCard(r) {
  const safeName = r.nombre ? r.nombre.replace(/</g,'&lt;') : `Ruta #${r.id}`
  return `
    <div class="route-card card p-5" data-route-id="${r.id}">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-lg font-semibold">${safeName}</div>
          <div class="mt-1">${statusBadge(r.status)}</div>
        </div>
        <button class="btn primary open-map-btn" data-route-id="${r.id}">
          ${openMaps.has(r.id) ? 'Ocultar mapa' : 'Abrir mapa'}
        </button>
      </div>
      <div class="mt-3 text-sm text-gray-600">
        <div><strong>ID:</strong> ${r.id}</div>
        ${r.unidad != null ? `<div><strong>Unidad:</strong> ${r.unidad}</div>` : 'Unidad:'}
        <div class="truncate"><strong>Última lat/long:</strong> ${r.lat ?? '—'} / ${r.long ?? '—'}</div>
      </div>
    </div>
  `
}

function renderGrid() {
  const list = showAll ? rutas : rutas.filter(x => x.status === 1)
  if (!list.length) {
    grid.innerHTML = `<div class="text-center text-sm text-gray-500 py-10">No hay rutas ${showAll ? '' : 'activas'}.</div>`
  } else {
    grid.innerHTML = list.map(routeCard).join('')
  }

  // Attach button listeners
  grid.querySelectorAll('.open-map-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.routeId)
      if (openMaps.has(id)) {
        // close
        const st = openMaps.get(id)
        if (st?.intervalId) clearInterval(st.intervalId)
        st?.destroy?.()
        openMaps.delete(id)
        renderGrid() // update button text
        return
      }
      // open
      const { mount, startPolling } = window.createRouteMap({ routeId: id, host: mapsHost })
      const destroy = mount()
      const intervalId = startPolling()
      openMaps.set(id, { intervalId, destroy })
      renderGrid()
    })
  })
}

// Auto refresh list
loadRoutes()
setInterval(loadRoutes, 5000)
