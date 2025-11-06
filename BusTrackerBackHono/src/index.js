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

export default app