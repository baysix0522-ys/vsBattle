/**
 * Canvas 기반 스프라이트 캐릭터 렌더링 (수정본)
 *
 * ⚠️ 원본 스프라이트 시트(1024x1536)는 행마다 프레임 수/크기가 다르고
 *    배경이 검정(blue) / 흰색(red)이라 256x256 균등 그리드로 자르면 안됨.
 *
 * ✅ 해결: 정규화된 스프라이트 시트 사용
 *    - blue-panda-sheet.png (768x1152, 투명배경)
 *    - red-panda-sheet.png  (960x1152, 투명배경)
 *    - 프레임 크기: 192x192px 고정
 *    - 행(row) = 애니메이션 종류, 열(col) = 프레임 번호
 *    - 배경 투명 처리 완료
 *
 * 파일 위치: public/sprites/blue-panda-sheet.png
 *           public/sprites/red-panda-sheet.png
 */

export type CharacterColor = 'blue' | 'red'
export type CharacterAction = 'idle' | 'run' | 'jump' | 'attack' | 'hit' | 'victory' | 'defeat'

interface CharacterState {
  x: number
  y: number
  color: CharacterColor
  action: CharacterAction
  facing: 'left' | 'right'
  frame: number
}

// ============================================================
//  스프라이트 시트 설정
// ============================================================

/**
 * 정규화된 시트의 프레임 크기 (정사각형)
 * 원본 프레임(~180x240)을 192x192 셀에 하단 정렬로 배치함
 */
const FRAME_SIZE = 192

/**
 * 애니메이션 메타데이터 (행 번호 + 프레임 수)
 *
 * ⚠️ blue와 red의 프레임 수가 다름 (idle: blue=4, red=5)
 *
 * 시트 레이아웃:
 *   Row 0: idle     (대기)       - blue:4f, red:5f
 *   Row 1: run      (달리기)     - 4f
 *   Row 2: attack   (공격+투사체) - 3f
 *   Row 3: hit      (피격)       - 3f
 *   Row 4: victory  (만세+반짝)  - 4f
 *   Row 5: defeat   (쓰러짐)     - 1f
 */
const ANIMATIONS: Record<CharacterColor, Record<CharacterAction, { row: number; count: number; fps: number }>> = {
  blue: {
    idle:    { row: 0, count: 4, fps: 8 },
    run:     { row: 1, count: 4, fps: 12 },
    jump:    { row: 1, count: 1, fps: 10 },   // run의 첫 프레임 재활용
    attack:  { row: 2, count: 3, fps: 12 },
    hit:     { row: 3, count: 3, fps: 10 },
    victory: { row: 4, count: 4, fps: 8 },
    defeat:  { row: 5, count: 1, fps: 4 },
  },
  red: {
    idle:    { row: 0, count: 5, fps: 8 },
    run:     { row: 1, count: 4, fps: 12 },
    jump:    { row: 1, count: 1, fps: 10 },
    attack:  { row: 2, count: 3, fps: 12 },
    hit:     { row: 3, count: 3, fps: 10 },
    victory: { row: 4, count: 4, fps: 8 },
    defeat:  { row: 5, count: 1, fps: 4 },
  },
}

// ============================================================
//  스프라이트 이미지 로드 / 캐시
// ============================================================

const spriteCache: Map<string, HTMLImageElement> = new Map()
const loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map()

/**
 * 정규화된 스프라이트 시트 로드
 *
 * ⚠️ 원본 파일(blue-panda.png)이 아니라
 *    정규화된 파일(blue-panda-sheet.png)을 로드해야 함
 */
export function loadSprite(color: CharacterColor): Promise<HTMLImageElement> {
  const url = `/sprites/${color}-panda-sheet.png`  // ← 정규화된 시트

  const cached = spriteCache.get(url)
  if (cached) return Promise.resolve(cached)

  const loading = loadingPromises.get(url)
  if (loading) return loading

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      spriteCache.set(url, img)
      loadingPromises.delete(url)
      resolve(img)
    }
    img.onerror = () => {
      loadingPromises.delete(url)
      reject(new Error(`Failed to load sprite: ${url}`))
    }
    img.src = url
  })

  loadingPromises.set(url, promise)
  return promise
}

export function preloadSprites(): Promise<void[]> {
  return Promise.all([loadSprite('blue'), loadSprite('red')]).then(() => [])
}

// ============================================================
//  스프라이트 그리기
// ============================================================

/**
 * 스프라이트 캐릭터 그리기
 *
 * @param scale - 화면 표시 크기 배율 (기본 0.5 → 192*0.5 = 96px)
 *               480px 화면에서 추천값:
 *               - 0.42 → 80px (작음)
 *               - 0.52 → 100px (적당)
 *               - 0.625 → 120px (존재감)
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  state: CharacterState,
  scale: number = 0.52
) {
  const { x, y, color, action, facing, frame } = state
  const sprite = spriteCache.get(`/sprites/${color}-panda-sheet.png`)

  if (!sprite) {
    loadSprite(color)
    drawLoadingPlaceholder(ctx, x, y, scale, color)
    return
  }

  // 해당 캐릭터+액션의 애니메이션 정보
  const anim = ANIMATIONS[color][action]
  const frameIndex = Math.floor(frame / (60 / anim.fps)) % anim.count

  // 시트에서 잘라올 위치
  const srcX = frameIndex * FRAME_SIZE
  const srcY = anim.row * FRAME_SIZE

  // 화면에 그릴 크기
  const displayW = FRAME_SIZE * scale
  const displayH = FRAME_SIZE * scale

  ctx.save()

  // 캐릭터 위치로 이동 (x, y는 발 밑 중앙 기준)
  ctx.translate(x, y)

  // 좌우 반전
  if (facing === 'left') {
    ctx.scale(-1, 1)
  }

  // 스프라이트 그리기
  // 시트의 프레임은 하단 정렬이므로, y 기준점 = 스프라이트 하단
  ctx.drawImage(
    sprite,
    srcX, srcY, FRAME_SIZE, FRAME_SIZE,    // source (시트에서 잘라올 영역)
    -displayW / 2, -displayH,               // dest (하단 중앙 기준)
    displayW, displayH                       // dest 크기
  )

  ctx.restore()
}

/**
 * 로딩 중 플레이스홀더
 */
function drawLoadingPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: CharacterColor
) {
  const size = Math.max(40, 60 * scale)
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = color === 'blue' ? 'rgba(74, 159, 217, 0.5)' : 'rgba(232, 84, 84, 0.5)'
  ctx.beginPath()
  ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFF'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('...', 0, -size / 2)
  ctx.restore()
}

// ============================================================
//  이펙트
// ============================================================

export function drawEffect(
  ctx: CanvasRenderingContext2D,
  type: 'impact' | 'dust' | 'spark',
  x: number,
  y: number,
  frame: number,
  scale: number = 1
) {
  ctx.save()
  ctx.translate(x, y)

  switch (type) {
    case 'impact': {
      const r = 20 + frame * 10
      const a = Math.max(0, 1 - frame * 0.08)
      ctx.strokeStyle = `rgba(255, 200, 100, ${a})`
      ctx.lineWidth = 4 * scale
      ctx.beginPath()
      ctx.arc(0, 0, r * scale, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = `rgba(255, 255, 200, ${a * 0.7})`
      ctx.lineWidth = 2 * scale
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.6 * scale, 0, Math.PI * 2)
      ctx.stroke()
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + frame * 0.1
        ctx.fillStyle = `rgba(255, 255, 200, ${a})`
        ctx.beginPath()
        ctx.arc(
          Math.cos(angle) * r * 0.9 * scale,
          Math.sin(angle) * r * 0.9 * scale,
          3 * scale, 0, Math.PI * 2
        )
        ctx.fill()
      }
      break
    }
    case 'dust': {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI + Math.PI
        const dist = frame * 4
        const a = Math.max(0, 1 - frame * 0.07)
        const s = (6 - frame * 0.4) * scale
        ctx.fillStyle = `rgba(180, 180, 180, ${a})`
        ctx.beginPath()
        ctx.arc(
          Math.cos(angle) * dist * scale,
          Math.sin(angle) * dist * scale * 0.5 - frame * 1.5,
          Math.max(1, s), 0, Math.PI * 2
        )
        ctx.fill()
      }
      break
    }
    case 'spark': {
      const a = Math.max(0, 1 - frame * 0.12)
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const dist = 15 + frame * 6
        ctx.strokeStyle = `rgba(255, 220, 100, ${a})`
        ctx.lineWidth = 2 * scale
        ctx.beginPath()
        ctx.moveTo(
          Math.cos(angle) * dist * 0.3 * scale,
          Math.sin(angle) * dist * 0.3 * scale
        )
        ctx.lineTo(
          Math.cos(angle) * dist * scale,
          Math.sin(angle) * dist * scale
        )
        ctx.stroke()
      }
      break
    }
  }

  ctx.restore()
}

// ============================================================
//  닉네임
// ============================================================

export function drawNickname(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nickname: string,
  color: CharacterColor
) {
  ctx.save()
  ctx.font = 'bold 13px "Noto Sans KR", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const metrics = ctx.measureText(nickname)
  const padding = 8
  const bgW = metrics.width + padding * 2
  const bgH = 22

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.beginPath()
  ctx.roundRect(x - bgW / 2, y, bgW, bgH, 6)
  ctx.fill()

  ctx.strokeStyle = color === 'blue' ? '#4A9FD9' : '#E85454'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(x - bgW / 2, y, bgW, bgH, 6)
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(nickname, x, y + 4)
  ctx.restore()
}
