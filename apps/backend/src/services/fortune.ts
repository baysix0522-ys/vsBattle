import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type FortuneCategory = 'overall' | 'love' | 'money' | 'health' | 'work'

export type TodayFortune = {
  date: string
  overall: {
    score: number
    summary: string
    detail: string
  }
  categories: {
    love: { score: number; message: string }
    money: { score: number; message: string }
    health: { score: number; message: string }
    work: { score: number; message: string }
  }
  luckyColor: string
  luckyNumber: number
  advice: string
}

function getTodayDate(): string {
  const now = new Date()
  // 한국 시간 (UTC+9)
  const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const year = koreaTime.getUTCFullYear()
  const month = koreaTime.getUTCMonth() + 1
  const day = koreaTime.getUTCDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[koreaTime.getUTCDay()]
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`
}

export async function generateTodayFortune(nickname: string): Promise<TodayFortune> {
  const today = getTodayDate()

  const prompt = `당신은 한국의 전통 사주/운세 전문가입니다. 오늘의 운세를 생성해주세요.

오늘 날짜: ${today}
사용자 닉네임: ${nickname}

다음 JSON 형식으로 정확히 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "overall": {
    "score": (1-100 사이 숫자),
    "summary": "(한 줄 요약, 20자 내외)",
    "detail": "(상세 운세, 100자 내외)"
  },
  "categories": {
    "love": { "score": (1-100), "message": "(연애운 메시지, 30자 내외)" },
    "money": { "score": (1-100), "message": "(금전운 메시지, 30자 내외)" },
    "health": { "score": (1-100), "message": "(건강운 메시지, 30자 내외)" },
    "work": { "score": (1-100), "message": "(직장/학업운 메시지, 30자 내외)" }
  },
  "luckyColor": "(오늘의 행운 색상, 한국어로)",
  "luckyNumber": (1-99 사이 행운의 숫자),
  "advice": "(오늘의 조언, 50자 내외)"
}

재미있고 긍정적인 톤으로 작성해주세요. 오늘 날짜와 요일에 맞는 운세를 생성해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  try {
    const fortune = JSON.parse(content.text)
    return {
      date: today,
      ...fortune,
    }
  } catch {
    throw new Error('Failed to parse fortune response')
  }
}
