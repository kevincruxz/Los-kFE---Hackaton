import { Hono } from "hono";

const app = new Hono();

// CORS
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (c.req.method === 'OPTIONS') return c.body(null, 204)
  await next()
})

app.get('/api/hello', c => 
    c.json({ msg: 'Hola desde Hono + Workers!' })
)

app.post('/api/echo', async c => {
  const body = await c.req.json().catch(() => ({}))
  return c.json({ youSent: body })
})

app.get('/api/get-prueba', async c => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Paradas').all()
  return c.json(results)
})

app.get('/rutas', async c => {
  const { results } = await c.env.DB.prepare('SELECT id, nombre, distancia, unidad, estatus FROM Rutas').all()
  return c.json(results)
})

app.post('/viajes/start', async c => {
  const { id_ruta, latitud_actual, longitud_actual, capacidad_actual } = await c.req.json();

  if (id_ruta === undefined || latitud_actual === undefined || longitud_actual === undefined) {
    return c.json({ error: 'Campos Faltantes: id_ruta, latitud_actual, longitud_actual' }, 400);
  }

  const firstStopResult = await c.env.DB.prepare(
    'SELECT id FROM Paradas WHERE id_ruta = ? ORDER BY orden_parada ASC LIMIT 1'
  ).bind(id_ruta).first();

  if (!firstStopResult) {
    return c.json({ error: 'Sin paradas encontradas para la ruta especificada' }, 404);
  }

  const proxima_parada_id = firstStopResult.id;

  const { success, meta } = await c.env.DB.prepare(
    "INSERT INTO Viajes (id_ruta, latitud_actual, longitud_actual, ultima_actualizacion, capacidad_actual, ultima_parada, proxima_parada) VALUES (?, ?, ?, DATETIME('now'), ?, NULL, ?)"
  ).bind(id_ruta, latitud_actual, longitud_actual, capacidad_actual || null, proxima_parada_id).run();

  if (!success) {
    return c.json({ error: 'Fallo al iniciar el viaje' }, 500);
  }

  const newTripId = meta.last_row_id;
  const { results } = await c.env.DB.prepare(
    'SELECT id, id_ruta, latitud_actual, longitud_actual, ultima_actualizacion, capacidad_actual, proxima_parada FROM Viajes WHERE id = ?'
  ).bind(newTripId).all();

  const newTrip = results[0];
  return c.json(newTrip, 201);
})

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

app.post('/viajes/:id/update', async c => {
  const tripId = c.req.param('id');
  const { latitud_actual, longitud_actual, capacidad_actual, umbral_metros } = await c.req.json();
  const umbral = umbral_metros || 40;

  if (latitud_actual === undefined || longitud_actual === undefined) {
    return c.json({ error: 'Campos Faltantes: latitud_actual, longitud_actual' }, 400);
  }

  let updateQuery = "UPDATE Viajes SET latitud_actual = ?, longitud_actual = ?, ultima_actualizacion = DATETIME('now')";
  const params = [latitud_actual, longitud_actual];
  if (capacidad_actual !== undefined) {
    updateQuery += ', capacidad_actual = ?';
    params.push(capacidad_actual);
  }
  updateQuery += ' WHERE id = ?';
  params.push(tripId);

  await c.env.DB.prepare(updateQuery).bind(...params).run();

  const trip = await c.env.DB.prepare('SELECT * FROM Viajes WHERE id = ?').bind(tripId).first();
  if (!trip) {
    return c.json({ error: 'Viaje no encontrado' }, 404);
  }

  let distancia_a_proxima = null;
  let avance_parada = false;
  let parada_alcanzada = null;

  if (trip.proxima_parada) {
    const proximaParada = await c.env.DB.prepare('SELECT * FROM Paradas WHERE id = ?').bind(trip.proxima_parada).first();

    if (proximaParada) {
      distancia_a_proxima = haversineDistance(trip.latitud_actual, trip.longitud_actual, proximaParada.latitud, proximaParada.longitud);

      if (distancia_a_proxima <= umbral) {
        avance_parada = true;
        parada_alcanzada = { id: proximaParada.id, orden_parada: proximaParada.orden_parada };

        const nuevaProximaParada = await c.env.DB.prepare(
          'SELECT id FROM Paradas WHERE id_ruta = ? AND orden_parada > ? ORDER BY orden_parada ASC LIMIT 1'
        ).bind(trip.id_ruta, proximaParada.orden_parada).first();

        const nuevaProximaParadaId = nuevaProximaParada ? nuevaProximaParada.id : null;

        await c.env.DB.prepare(
          'UPDATE Viajes SET ultima_parada = ?, proxima_parada = ? WHERE id = ?'
        ).bind(trip.proxima_parada, nuevaProximaParadaId, tripId).run();

        const updatedTrip = await c.env.DB.prepare('SELECT * FROM Viajes WHERE id = ?').bind(tripId).first();
        Object.assign(trip, updatedTrip);
      }
    }
  }

  return c.json({
    id: trip.id,
    id_ruta: trip.id_ruta,
    latitud_actual: trip.latitud_actual,
    longitud_actual: trip.longitud_actual,
    ultima_actualizacion: trip.ultima_actualizacion,
    capacidad_actual: trip.capacidad_actual,
    ultima_parada: trip.ultima_parada,
    proxima_parada: trip.proxima_parada,
    distancia_a_proxima,
    avance_parada,
    parada_alcanzada
  });
});

app.get('/rutas/:id_ruta/paradas/status', async c => {
  const { id_ruta } = c.req.param();

  const lastPassedStopOrderResult = await c.env.DB.prepare(
    `SELECT P.orden_parada
     FROM Viajes V
     JOIN Paradas P ON V.ultima_parada = P.id
     WHERE V.id_ruta = ?
     ORDER BY V.ultima_actualizacion DESC
     LIMIT 1`
  ).bind(id_ruta).first();

  const lastPassedStopOrder = lastPassedStopOrderResult ? lastPassedStopOrderResult.orden_parada : 0;

  const { results: paradas } = await c.env.DB.prepare(
    'SELECT id, orden_parada, latitud, longitud, nombre FROM Paradas WHERE id_ruta = ? ORDER BY orden_parada ASC'
  ).bind(id_ruta).all();

  const paradasConEstatus = paradas.map(parada => ({
    ...parada,
    estatus: parada.orden_parada <= lastPassedStopOrder ? 'pasada' : 'no pasada'
  }));

  return c.json({ paradas: paradasConEstatus });
});

app.get('/rutas/:id_ruta/paradas', async c => {
  const { id_ruta } = c.req.param();

  const { results: paradas } = await c.env.DB.prepare(
    'SELECT id, orden_parada, latitud, longitud, nombre FROM Paradas WHERE id_ruta = ? ORDER BY orden_parada ASC'
  ).bind(id_ruta).all();

  return c.json({ paradas });
});

export default app