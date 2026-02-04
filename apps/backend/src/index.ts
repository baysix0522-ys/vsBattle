import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import authRouter from './routes/auth.js'
import fortuneRouter from './routes/fortune.js'
import battleRouter from './routes/battle.js'

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', ts: Date.now() })
})

// Auth routes
app.use('/api/auth', authRouter)

// Fortune routes
app.use('/api/fortune', fortuneRouter)

// Battle routes (사주 대결)
app.use('/api/battle', battleRouter)

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
