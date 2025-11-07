// shared/api.js
export const DEFAULT_API_BASE = 'https://api-hono.kevin-cruzz.workers.dev';
export const API_BASE = (window.API_BASE && typeof window.API_BASE === 'string' && window.API_BASE.length > 0)
  ? window.API_BASE
  : DEFAULT_API_BASE;

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} → HTTP ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok || (data && data.success === false)) {
    const msg = (data && (data.message || data.errorMsg)) || `POST ${path} failed`;
    throw new Error(msg);
  }
  return data;
}

// Referencias de Saltillo y Ramos Arizpe (aprox)
export const REF_POINTS = {
  saltillo: { name: 'Saltillo', coords: [25.426, -100.995] },
  ramos:    { name: 'Ramos Arizpe', coords: [25.549, -100.947] },
};

export const REF_BOUNDS = [REF_POINTS.saltillo.coords, REF_POINTS.ramos.coords];

// 📍 Ruta 1 específica: PRI Saltillo → UTC Ramos Arizpe
export const PRI_SALTILLO = [25.46801, -100.98028] // PRI Estatal Saltillo (aprox)
export const UTC_RAMOS = [25.55694, -100.93611] // UTC Ramos Arizpe (aprox)
export const ARRIVAL_RADIUS_M = 60 // radio de llegada ~60 m (ajústalo si quieres)
export const ROUTE1_COORDS = [
PRI_SALTILLO,
[25.471458, -100.977453],
  [25.471354, -100.977539],
  [25.471494, -100.977440],
  [25.473139, -100.976628],
  [25.473822, -100.976330],
  [25.474572, -100.975952],
  [25.474723, -100.975927],
  [25.479512, -100.973647],
  [25.479753, -100.973609],
  [25.496215, -100.965515],
  [25.496920, -100.965143],
  [25.497922, -100.964492],
  [25.498833, -100.963866],
  [25.499046, -100.963792],
  [25.503253, -100.961158],
  [25.503958, -100.960947],
  [25.504707, -100.960934],
  [25.508584, -100.961158],
  [25.509333, -100.961127],
  [25.509730, -100.960978],
  [25.510239, -100.960730],
  [25.520274, -100.955108],
  [25.522631, -100.953804],
  [25.523009, -100.953638],
  [25.526480, -100.952466],
  [25.529015, -100.951574],
  [25.532109, -100.950543],
  [25.532688, -100.950105],
  [25.533280, -100.949620],
  [25.534853, -100.948197],
  [25.535370, -100.947760],
  [25.536993, -100.946280],
  [25.537595, -100.945691],
  [25.544011, -100.939881],
  [25.545389, -100.938567],
  [25.545732, -100.938301],
  [25.546413, -100.937676],
  [25.547076, -100.937004],
  [25.547673, -100.936331],
  [25.549178, -100.934361],
  [25.550472, -100.932729],
  [25.552291, -100.930354],
  [25.556538, -100.924930],
  [25.556594, -100.924750],
  [25.557547, -100.923602],
  [25.558069, -100.923067],
  [25.558644, -100.922632],
  [25.558756, -100.922613],
  [25.559091, -100.922412],
  [25.559273, -100.922496],
  [25.559337, -100.922626],
  [25.559307, -100.922867],
  [25.558817, -100.923173],
  [25.558707, -100.923313],
  [25.558238, -100.923622],
  [25.557796, -100.924113],
  [25.557560, -100.924470],
  [25.556230, -100.926195],
  [25.553518, -100.929681],
  [25.553507, -100.930121],
  [25.553569, -100.930583],
  [25.554153, -100.931135],
  [25.554902, -100.932046],
  [25.555235, -100.932569],
  [25.555249, -100.932623],
  [25.555404, -100.932965],
  [25.555526, -100.933387],
  [25.556309, -100.934494],
UTC_RAMOS,
]

//Icono de BUS
export const BUS_ICON_URL = '../assets/bus-icon.jpg'
export const BUS_ICON_SIZE = [40, 40]    // ajustar al tamaño de la imagen
export const BUS_ICON_ANCHOR = [20, 40]  // punto de apoyo del pin
export const BUS_POPUP_ANCHOR = [0, -36] // desplazamiento del popup para no tapar el icono
//sombra por defecto de Leaflet para mejor percepción de profundidad
export const BUS_SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
export const BUS_SHADOW_SIZE = [41, 41]
export const BUS_SHADOW_ANCHOR = [13, 41]