import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { ensureRiceTransactionsTable, ensureNameAnalysisTable } from './db/index.js'
import authRouter from './routes/auth.js'
import fortuneRouter from './routes/fortune.js'
import battleRouter from './routes/battle.js'
import userRouter from './routes/user.js'
import nameRouter from './routes/name.js'

const app = express()
app.disable('x-powered-by')

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173']

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
)
app.use(express.json())

// Health check
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'saju-battle-api', ts: Date.now() })
})
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', ts: Date.now() })
})

// Auth routes
app.use('/api/auth', authRouter)

// Fortune routes
app.use('/api/fortune', fortuneRouter)

// Battle routes (사주 대결)
app.use('/api/battle', battleRouter)

// User routes (마이페이지, 쌀 내역)
app.use('/api/user', userRouter)

// Name routes (이름 풀이)
app.use('/api/name', nameRouter)

const port = Number(process.env.PORT ?? 4000)

// 테이블 생성 확인 후 서버 시작
Promise.all([
  ensureRiceTransactionsTable(),
  ensureNameAnalysisTable(),
]).then(() => {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
  })
})
