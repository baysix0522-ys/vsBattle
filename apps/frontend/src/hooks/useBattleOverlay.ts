/**
 * 오버레이 자동 배틀 훅
 * DOM 요소를 플랫폼으로 사용하는 2D 액션 전투 시스템
 */
import { useRef, useCallback, useEffect, useState } from 'react'

// 물리 상수
const G = 800      // 중력
const JV = -400    // 점프 속도
const SPD = 200    // 이동 속도
const CW = 96      // 캐릭터 너비 (192 * 0.5)
const CH = 96      // 캐릭터 높이

// 스프라이트 프레임 크기 (정규화된 시트: 192x192)
const FS = 192

// 애니메이션 메타데이터
export interface AnimMeta {
  row: number
  count: number
}

export type AnimState = 'idle' | 'run' | 'jump' | 'air' | 'fall' | 'land' | 'attack' | 'hit' | 'ko' | 'win'

// 정규화된 시트 레이아웃:
// Row 0: idle, Row 1: run, Row 2: attack, Row 3: hit, Row 4: victory, Row 5: defeat
// ⚠️ blue idle=4프레임, red idle=5프레임 (나머지 동일)
const BLUE_META: Record<AnimState, AnimMeta> = {
  idle: { row: 0, count: 4 },
  run: { row: 1, count: 4 },
  jump: { row: 1, count: 1 },    // run row 첫 프레임 재활용
  air: { row: 1, count: 1 },     // run row 재사용
  fall: { row: 1, count: 1 },    // run row 재사용
  land: { row: 1, count: 1 },    // run row 재사용
  attack: { row: 2, count: 3 },
  hit: { row: 3, count: 3 },
  ko: { row: 5, count: 1 },      // defeat
  win: { row: 4, count: 4 },     // victory
}

const RED_META: Record<AnimState, AnimMeta> = {
  idle: { row: 0, count: 5 },    // red는 idle 5프레임
  run: { row: 1, count: 4 },
  jump: { row: 1, count: 1 },
  air: { row: 1, count: 1 },
  fall: { row: 1, count: 1 },
  land: { row: 1, count: 1 },
  attack: { row: 2, count: 3 },
  hit: { row: 3, count: 3 },
  ko: { row: 5, count: 1 },
  win: { row: 4, count: 4 },
}

// 캐릭터 상태
export interface Fighter {
  x: number
  y: number
  vx: number
  vy: number
  gr: boolean       // on ground
  flip: boolean
  an: AnimState     // animation state
  fr: number        // current frame
  tm: number        // animation timer
  hp: number
  mhp: number       // max hp
  atk: boolean      // attacking
  at: number        // attack timer
  ah: boolean       // attack hit (already hit this attack)
  hs: number        // hitstun timer
  inv: number       // invincibility timer
  dead: boolean
  ait: number       // ai timer
  nm: string        // nickname
  isBlue: boolean
}

// 플랫폼
export interface Platform {
  x: number
  y: number
  w: number
  h: number
}

// 파티클
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  l: number   // life
  ml: number  // max life
  s: number   // size
  c: string   // color
  g: number   // gravity
}

// 배틀 로그
export interface BattleLog {
  id: string
  message: string
  timestamp: number
}

export interface UseBattleOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>
  challenger: { nickname: string; dayMaster?: string }
  opponent: { nickname: string; dayMaster?: string }
  platformSelectors?: string
  onBattleEnd?: (winner: 'p1' | 'p2') => void
  autoStart?: boolean
}

export interface UseBattleOverlayReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>
  isRunning: boolean
  p1: Fighter | null
  p2: Fighter | null
  particles: Particle[]
  logs: BattleLog[]
  shake: number
  start: () => void
  stop: () => void
}

export function useBattleOverlay({
  containerRef,
  challenger,
  opponent,
  platformSelectors = '.stat-card,.summary-section,.total-section,.chemistry-card,.rounds-detail,.result-banner',
  onBattleEnd,
  autoStart = true,
}: UseBattleOverlayProps): UseBattleOverlayReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [shake, setShake] = useState(0)
  const [logs, setLogs] = useState<BattleLog[]>([])

  // 게임 상태 refs (리렌더링 방지)
  const p1Ref = useRef<Fighter | null>(null)
  const p2Ref = useRef<Fighter | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const runningRef = useRef(false)
  const shakeRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animFrameRef = useRef<number>(0)

  // 스프라이트 이미지
  const blueImgRef = useRef<HTMLImageElement | null>(null)
  const redImgRef = useRef<HTMLImageElement | null>(null)

  // 로그 ID 카운터
  const logIdRef = useRef(0)

  // 플랫폼 가져오기 (컨테이너 상대 좌표)
  const getPlats = useCallback((): Platform[] => {
    const container = containerRef.current
    if (!container) return []

    const cr = container.getBoundingClientRect()
    const cw = cr.width
    const ch = cr.height

    // 바닥
    const P: Platform[] = [
      { x: 0, y: ch - 2, w: cw, h: 20 }
    ]

    document.querySelectorAll(platformSelectors).forEach(el => {
      const r = el.getBoundingClientRect()
      const relX = r.left - cr.left
      const relY = r.top - cr.top
      if (relY + r.height > 40 && relY < ch - 10 && r.height > 20) {
        P.push({ x: relX, y: relY, w: r.width, h: r.height })
      }
    })

    return P
  }, [platformSelectors, containerRef])

  // 배틀 로그 추가
  const addLog = useCallback((message: string) => {
    const id = `log-${++logIdRef.current}`
    setLogs(prev => {
      const newLogs = [{ id, message, timestamp: Date.now() }, ...prev]
      return newLogs.slice(0, 3)
    })

    // 자동 제거
    setTimeout(() => {
      setLogs(prev => prev.filter(l => l.id !== id))
    }, 2800)
  }, [])

  // 파티클 생성
  const dust = useCallback((x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x, y: y + 2,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        l: 0.25 + Math.random() * 0.15,
        ml: 0.35,
        s: 2 + Math.random() * 3,
        c: 'rgba(180,180,220,.5)',
        g: 0.1
      })
    }
  }, [])

  const sparks = useCallback((x: number, y: number, blue: boolean) => {
    const cs = blue
      ? ['#4488ff', '#88ccff', '#fff', '#aaddff']
      : ['#ff5533', '#ffaa44', '#fff', '#ffcc66']

    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 3 + Math.random() * 6
      particlesRef.current.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        l: 0.2 + Math.random() * 0.2,
        ml: 0.35,
        s: 2 + Math.random() * 3,
        c: cs[Math.floor(Math.random() * cs.length)]!,
        g: 0
      })
    }
  }, [])

  const burst = useCallback((x: number, y: number, blue: boolean) => {
    const cs = blue
      ? ['#2266ff', '#44aaff', '#88ddff']
      : ['#ff3322', '#ff8844', '#ffcc44']

    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 1 + Math.random() * 6
      particlesRef.current.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2,
        l: 0.4 + Math.random() * 0.4,
        ml: 0.7,
        s: 2 + Math.random() * 4,
        c: cs[Math.floor(Math.random() * cs.length)]!,
        g: -0.03
      })
    }
  }, [])

  // 캐릭터 생성
  const makeFighter = useCallback((
    x: number, y: number, nm: string, isBlue: boolean
  ): Fighter => ({
    x, y, vx: 0, vy: 0, gr: false,
    flip: !isBlue,
    an: 'idle', fr: 0, tm: 0,
    hp: 400, mhp: 400,
    atk: false, at: 0, ah: false,
    hs: 0, inv: 0, dead: false, ait: 0,
    nm, isBlue
  }), [])

  // AI 로직
  const ai = useCallback((c: Fighter, e: Fighter, dt: number) => {
    if (c.dead || c.hs > 0 || c.atk) return

    c.flip = e.x < c.x
    c.ait -= dt
    if (c.ait > 0) return

    const dx = e.x - c.x
    const dy = e.y - c.y
    const dist = Math.hypot(dx, dy)

    if (dist < 70 && Math.abs(dy) < 45) {
      // 공격 범위 내
      c.atk = true
      c.an = 'attack'
      c.fr = 0
      c.tm = 0
      c.at = 0
      c.ah = false
      c.vx *= 0.2
      c.ait = 0.1
    } else if (dist > 95) {
      // 추격
      c.vx = dx > 0 ? SPD * 0.85 : -SPD * 0.85
      if (c.gr && c.an !== 'run') {
        c.an = 'run'
        c.fr = 0
      }
      if (dy < -60 && c.gr && Math.random() < 0.4) {
        c.vy = JV
        c.gr = false
        dust(c.x, c.y)
      } else if (c.gr && Math.random() < 0.06) {
        c.vy = JV
        c.gr = false
        dust(c.x, c.y)
      }
      c.ait = 0.08 + Math.random() * 0.12
    } else {
      // 근접 전투
      if (Math.random() < 0.35) {
        c.vx = dx > 0 ? SPD * 0.7 : -SPD * 0.7
        if (c.gr && c.an !== 'run') {
          c.an = 'run'
          c.fr = 0
        }
      } else if (Math.random() < 0.3 && c.gr) {
        c.vy = JV
        c.gr = false
        c.vx = dx > 0 ? SPD * 0.5 : -SPD * 0.5
        dust(c.x, c.y)
      } else {
        c.vx *= 0.7
        if (c.gr && c.an !== 'idle') {
          c.an = 'idle'
          c.fr = 0
        }
      }
      c.ait = 0.1 + Math.random() * 0.2
    }
  }, [dust])

  // 물리 시뮬레이션
  const phys = useCallback((c: Fighter, dt: number, P: Platform[]) => {
    c.vy += G * dt
    c.x += c.vx * dt
    c.y += c.vy * dt

    if (c.hs > 0) c.hs -= dt
    if (c.inv > 0) c.inv -= dt

    c.gr = false

    // 플랫폼 충돌
    for (const p of P) {
      if (c.vy >= 0 && c.x > p.x + 6 && c.x < p.x + p.w - 6 && c.y >= p.y - 3 && c.y <= p.y + 14) {
        c.y = p.y
        c.vy = 0
        c.gr = true
        if (c.an === 'fall' || c.an === 'air') {
          c.an = 'land'
          c.fr = 0
          c.tm = 0
          dust(c.x, c.y)
        }
      }
    }

    // 경계 제한 (컨테이너 기준)
    const container = containerRef.current
    const cw = container ? container.clientWidth : 480
    const ch = container ? container.clientHeight : 600
    c.x = Math.max(20, Math.min(cw - 20, c.x))
    if (c.y > ch + 30) {
      c.y = -20
      c.vy = 0
    }
    if (c.y < -50) {
      c.y = -50
      c.vy = Math.max(0, c.vy)
    }

    // 공중 애니메이션
    if (!c.gr && !c.atk && !c.dead && c.hs <= 0) {
      if (c.vy < -30) c.an = 'air'
      else if (c.vy > 30) c.an = 'fall'
    }

    // 지면 마찰
    if (c.gr && !c.atk && c.hs <= 0) {
      c.vx *= 0.85
    }

    // 애니메이션 프레임 업데이트
    c.tm += dt
    const sp: Record<AnimState, number> = {
      idle: 0.16, run: 0.1, attack: 0.1, hit: 0.14,
      ko: 0.2, jump: 0.1, air: 1, fall: 1, land: 0.14, win: 0.18
    }

    if (c.tm >= (sp[c.an] || 0.12)) {
      c.tm = 0
      c.fr++
      const meta = c.isBlue ? BLUE_META : RED_META
      const m = meta[c.an]
      if (!m) {
        c.an = 'idle'
        c.fr = 0
        return
      }
      if (c.fr >= m.count) {
        if (c.an === 'attack') {
          c.atk = false
          c.an = 'idle'
          c.fr = 0
        } else if (c.an === 'ko' || c.an === 'win') {
          c.fr = m.count - 1
        } else if (c.an === 'hit') {
          c.an = 'idle'
          c.fr = 0
        } else if (c.an === 'land') {
          c.an = 'idle'
          c.fr = 0
        } else {
          c.fr = 0
        }
      }
    }

    if (c.atk) c.at += dt
  }, [dust])

  // 전투 판정
  const combat = useCallback((a: Fighter, d: Fighter) => {
    if (!a.atk || a.ah || d.dead || d.inv > 0) return
    if (a.fr < 1 || a.at < 0.12) return

    const dist = Math.hypot(a.x - d.x, a.y - d.y)
    const fac = a.flip ? (d.x < a.x) : (d.x > a.x)

    if (dist < CW * 1.2 && (fac || dist < 40)) {
      a.ah = true
      const crit = Math.random() < 0.18
      let dmg = 28 + Math.floor(Math.random() * 16)
      if (crit) dmg = Math.floor(dmg * 2.1)

      d.hp = Math.max(0, d.hp - dmg)
      d.hs = 0.3
      d.inv = 0.4
      d.an = 'hit'
      d.fr = 0
      d.tm = 0
      d.atk = false

      const dir = d.x > a.x ? 1 : -1
      d.vx = dir * (crit ? 280 : 150)
      d.vy = -130

      const hx = (a.x + d.x) / 2
      const hy = (a.y + d.y) / 2 - 15
      sparks(hx, hy, a.isBlue)

      if (crit) {
        burst(hx, hy, a.isBlue)
        shakeRef.current = 0.3
        setShake(0.3)
      } else {
        shakeRef.current = 0.12
        setShake(0.12)
      }

      const ns = a.isBlue
        ? ['해수 파동!', '수기 타격!', '편관 강타!', '을목 연격!']
        : ['화기 폭발!', '병화 타격!', '정관 강타!', '갑목 연격!']

      const msg = `${a.nm} ${ns[Math.floor(Math.random() * ns.length)]} ${dmg}${crit ? ' 💥크리티컬!' : ''}`
      addLog(msg)
    }
  }, [sparks, burst, addLog])

  // 스프라이트 그리기
  const drawSprite = useCallback((
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    meta: AnimMeta,
    fr: number,
    x: number, y: number,
    w: number, h: number,
    flip: boolean
  ) => {
    if (!img.complete || !meta) return

    ctx.save()
    if (flip) {
      ctx.translate(x + w / 2, y)
      ctx.scale(-1, 1)
      ctx.drawImage(
        img,
        (fr % meta.count) * FS, meta.row * FS, FS, FS,
        -w / 2, 0, w, h
      )
    } else {
      ctx.drawImage(
        img,
        (fr % meta.count) * FS, meta.row * FS, FS, FS,
        x, y, w, h
      )
    }
    ctx.restore()
  }, [])

  // 메인 그리기 함수
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!runningRef.current) return

    const p1 = p1Ref.current
    const p2 = p2Ref.current
    if (!p1 || !p2) return

    ctx.save()

    // 화면 흔들림
    if (shakeRef.current > 0) {
      shakeRef.current -= 0.016 * 8
      ctx.translate(
        (Math.random() - 0.5) * shakeRef.current * 14,
        (Math.random() - 0.5) * shakeRef.current * 14
      )
      setShake(shakeRef.current)
    }

    // 파티클 업데이트 및 그리기
    const particles = particlesRef.current
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      p.x += p.vx
      p.y += p.vy
      p.vy += p.g || 0
      p.vx *= 0.97
      p.l -= 0.016

      if (p.l <= 0) {
        particles.splice(i, 1)
        continue
      }

      ctx.globalAlpha = Math.max(0, p.l / p.ml)
      ctx.fillStyle = p.c
      const s = p.s * (0.5 + (p.l / p.ml) * 0.5)
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
    }

    ctx.globalAlpha = 1

    // 캐릭터 그리기
    const blueImg = blueImgRef.current
    const redImg = redImgRef.current

    for (const c of [p1, p2]) {
      if (c.inv > 0 && Math.floor(c.inv * 16) % 2) continue

      const meta = c.isBlue ? BLUE_META : RED_META
      const m = meta[c.an] || meta.idle
      if (!m) continue

      const img = c.isBlue ? blueImg : redImg
      if (!img) continue

      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,.25)'
      ctx.beginPath()
      ctx.ellipse(c.x, c.y + 4, 24, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      drawSprite(ctx, img, m, c.fr, c.x - CW / 2, c.y - CH, CW, CH, c.flip)
    }

    ctx.restore()
  }, [drawSprite])

  // 게임 루프
  const loop = useCallback((now: number) => {
    const dt = Math.min(0.04, (now - lastTimeRef.current) / 1000)
    lastTimeRef.current = now

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (runningRef.current && p1Ref.current && p2Ref.current) {
      const P = getPlats()
      const p1 = p1Ref.current
      const p2 = p2Ref.current

      ai(p1, p2, dt)
      ai(p2, p1, dt)
      phys(p1, dt, P)
      phys(p2, dt, P)
      combat(p1, p2)
      combat(p2, p1)

      // KO 체크
      if (p1.hp <= 0 && !p1.dead) {
        p1.dead = true
        p1.an = 'ko'
        p1.fr = 0
        p2.an = 'win'
        p2.fr = 0
        p2.atk = false

        setTimeout(() => {
          runningRef.current = false
          setIsRunning(false)
          addLog(`🏆 ${p2.nm} 승리!`)
          onBattleEnd?.('p2')
        }, 1500)
      }

      if (p2.hp <= 0 && !p2.dead) {
        p2.dead = true
        p2.an = 'ko'
        p2.fr = 0
        p1.an = 'win'
        p1.fr = 0
        p1.atk = false

        setTimeout(() => {
          runningRef.current = false
          setIsRunning(false)
          addLog(`🏆 ${p1.nm} 승리!`)
          onBattleEnd?.('p1')
        }, 1500)
      }
    }

    if (ctx) {
      draw(ctx)
    }

    animFrameRef.current = requestAnimationFrame(loop)
  }, [getPlats, ai, phys, combat, draw, addLog, onBattleEnd])

  // 시작
  const start = useCallback(() => {
    const container = containerRef.current
    const w = container ? container.clientWidth : 480
    const h = container ? container.clientHeight : 600

    p1Ref.current = makeFighter(
      w * 0.2, h * 0.3,
      challenger.nickname,
      true
    )
    p2Ref.current = makeFighter(
      w * 0.8, h * 0.3,
      opponent.nickname,
      false
    )
    p2Ref.current.flip = true

    particlesRef.current = []
    shakeRef.current = 0
    setShake(0)
    setLogs([])

    runningRef.current = true
    setIsRunning(true)

    addLog('⚔️ 사주 대결 시작!')
  }, [makeFighter, challenger.nickname, opponent.nickname, addLog])

  // 정지
  const stop = useCallback(() => {
    runningRef.current = false
    setIsRunning(false)
  }, [])

  // 초기화 및 정리
  useEffect(() => {
    // 정규화된 스프라이트 시트 로드
    const blueImg = new Image()
    blueImg.src = '/sprites/blue-panda-sheet.png'
    blueImgRef.current = blueImg

    const redImg = new Image()
    redImg.src = '/sprites/red-panda-sheet.png'
    redImgRef.current = redImg

    // 캔버스 리사이즈 (컨테이너 크기에 맞춤)
    const resize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (canvas && container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // 컨테이너 크기 변경 감지
    const ro = new ResizeObserver(resize)
    if (containerRef.current) ro.observe(containerRef.current)

    // 게임 루프 시작
    lastTimeRef.current = performance.now()
    animFrameRef.current = requestAnimationFrame(loop)

    // 자동 시작
    if (autoStart) {
      // 약간의 딜레이 후 시작 (DOM 렌더링 대기)
      setTimeout(start, 500)
    }

    return () => {
      window.removeEventListener('resize', resize)
      ro.disconnect()
      cancelAnimationFrame(animFrameRef.current)
      runningRef.current = false
    }
  }, [loop, start, autoStart, containerRef])

  return {
    canvasRef,
    isRunning,
    p1: p1Ref.current,
    p2: p2Ref.current,
    particles: particlesRef.current,
    logs,
    shake,
    start,
    stop,
  }
}
