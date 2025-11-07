// shared/leaflet-setup.js
// Fix de íconos por CDN para evitar configuración extra
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export function addReferencePoints(map) {
  const refs = [
    { ...REF_POINTS.saltillo, color: '#1e3a8a' },
    { ...REF_POINTS.ramos,    color: '#16a34a' },
  ];
  refs.forEach(r => {
    const icon = L.divIcon({
      html: `<div style="background:white;border:2px solid ${r.color};border-radius:9999px;padding:4px;font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,.2)">${r.name}</div>`,
      className: 'ref-icon',
      iconSize: [110, 24],
      iconAnchor: [55, 12]
    });
    L.marker(r.coords, { icon }).addTo(map);
  });
}
