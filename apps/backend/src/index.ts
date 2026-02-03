import cors from 'cors'
import 'dotenv/config'
import express from 'express'

const app = express()
app.disable('x-powered-by')

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173']

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', ts: Date.now() })
})

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
