import { useEffect, useState } from 'react'

type HealthResponse = {
  ok: boolean
  service: string
  ts: number
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const res = await fetch('/api/health')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as HealthResponse
        if (!cancelled) setHealth(json)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page">
      <header className="header">
        <h1>사주 배틀</h1>
        <p className="sub">React + Node 기본 개발환경</p>
      </header>

      <section className="card">
        <h2>Backend Health</h2>
        {error ? <p className="error">{error}</p> : null}
        {health ? (
          <pre className="code">{JSON.stringify(health, null, 2)}</pre>
        ) : (
          <p className="muted">Loading...</p>
        )}
      </section>
    </main>
  )
}
