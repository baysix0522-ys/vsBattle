import {
  getSaju,
  getTodaySaju,
  getDayMaster,
  checkElementRelation,
  STEM_TO_ELEMENT,
  ELEMENT_TRAITS,
  type BirthInfo,
  type FiveElement,
  type HeavenlyStem,
} from './saju'

// 운세 결과 타입
export type FortuneResult = {
  date: string
  dayMaster: HeavenlyStem
  dayMasterElement: FiveElement
  todayElement: FiveElement
  overall: {
    score: number
    grade: string
    summary: string
    detail: string
  }
  categories: {
    love: { score: number; message: string }
    money: { score: number; message: string }
    health: { score: number; message: string }
    work: { score: number; message: string }
  }
  lucky: {
    color: string
    number: number
    direction: string
    time: string
  }
  advice: string
}

// 일간별 기본 운세 메시지
const DAY_MASTER_MESSAGES: Record<HeavenlyStem, {
  personality: string
  strength: string
  advice: string
}> = {
  갑: {
    personality: '큰 나무처럼 굳건하고 리더십이 있는',
    strength: '결단력과 추진력',
    advice: '유연함을 더하면 더 큰 성취를 이룰 수 있어요',
  },
  을: {
    personality: '덩굴처럼 유연하고 적응력이 뛰어난',
    strength: '협조성과 인내력',
    advice: '자신감을 가지고 의견을 표현해보세요',
  },
  병: {
    personality: '태양처럼 밝고 열정적인',
    strength: '표현력과 사교성',
    advice: '때로는 쉬어가며 에너지를 충전하세요',
  },
  정: {
    personality: '촛불처럼 따뜻하고 섬세한',
    strength: '배려심과 창의력',
    advice: '작은 불씨도 큰 불이 됩니다. 꾸준히 노력하세요',
  },
  무: {
    personality: '산처럼 듬직하고 신뢰감 있는',
    strength: '안정감과 포용력',
    advice: '변화를 두려워하지 말고 새로운 도전을 해보세요',
  },
  기: {
    personality: '정원처럼 부드럽고 조화로운',
    strength: '중재력과 실용성',
    advice: '자신의 가치를 더 인정해주세요',
  },
  경: {
    personality: '강철처럼 단단하고 정의로운',
    strength: '실행력과 결단력',
    advice: '부드러움과 유연함도 힘이 될 수 있어요',
  },
  신: {
    personality: '보석처럼 섬세하고 완벽을 추구하는',
    strength: '분석력과 심미안',
    advice: '완벽하지 않아도 괜찮아요. 과정을 즐기세요',
  },
  임: {
    personality: '바다처럼 넓고 포용력 있는',
    strength: '지혜와 적응력',
    advice: '흐름을 읽되, 때로는 방향을 정해보세요',
  },
  계: {
    personality: '이슬처럼 맑고 순수한',
    strength: '직관력과 감수성',
    advice: '작은 물방울이 모여 강이 됩니다. 꾸준함이 답이에요',
  },
}

// 오행 상성에 따른 운세 점수 조정
function getElementScore(relation: ReturnType<typeof checkElementRelation>): number {
  switch (relation) {
    case 'generated': return 90 // 나를 생해주는 관계 - 매우 좋음
    case 'same': return 80 // 같은 오행 - 좋음
    case 'generating': return 70 // 내가 생해주는 관계 - 보통
    case 'overcome': return 50 // 나를 극하는 관계 - 주의
    case 'overcoming': return 60 // 내가 극하는 관계 - 약간 주의
    default: return 70
  }
}

// 오행 상성에 따른 메시지
function getElementMessage(relation: ReturnType<typeof checkElementRelation>, category: string): string {
  const messages: Record<string, Record<string, string>> = {
    generated: {
      love: '오늘은 좋은 인연이 다가올 수 있는 날이에요',
      money: '재물운이 상승하는 날, 좋은 기회를 놓치지 마세요',
      health: '활력이 넘치는 하루가 될 거예요',
      work: '일이 술술 풀리는 날, 적극적으로 나서보세요',
    },
    same: {
      love: '편안하고 안정적인 관계가 유지되는 날이에요',
      money: '안정적인 재정 상태를 유지할 수 있어요',
      health: '무난하게 컨디션을 유지할 수 있어요',
      work: '꾸준히 노력한 만큼 결과가 나타나요',
    },
    generating: {
      love: '베풂의 기쁨을 느낄 수 있는 날이에요',
      money: '지출이 있을 수 있지만 가치 있는 투자가 될 거예요',
      health: '무리하지 않는 선에서 활동하세요',
      work: '팀워크가 빛을 발하는 날이에요',
    },
    overcome: {
      love: '오해가 생길 수 있어요. 대화로 풀어보세요',
      money: '충동구매를 자제하고 신중하게 결정하세요',
      health: '스트레스 관리에 신경 쓰세요',
      work: '예상치 못한 변수가 있을 수 있어요. 유연하게 대처하세요',
    },
    overcoming: {
      love: '주도권을 잡되 상대방 의견도 존중해주세요',
      money: '공격적인 투자보다 안정적인 관리가 좋아요',
      health: '과로를 피하고 휴식을 취하세요',
      work: '성과를 내기 좋은 날이지만 무리는 금물',
    },
  }
  return messages[relation]?.[category] || '오늘도 좋은 하루 되세요!'
}

// 등급 계산
function getGrade(score: number): string {
  if (score >= 90) return '대길'
  if (score >= 80) return '길'
  if (score >= 70) return '중길'
  if (score >= 60) return '소길'
  return '평'
}

// 행운의 시간 계산 (지지 기반)
function getLuckyTime(element: FiveElement): string {
  const times: Record<FiveElement, string> = {
    목: '오전 5시-9시 (인시~진시)',
    화: '오전 9시-오후 1시 (사시~오시)',
    토: '오후 1시-3시, 7시-9시 (미시, 술시)',
    금: '오후 3시-7시 (신시~유시)',
    수: '오후 9시-오전 1시 (해시~자시)',
  }
  return times[element]
}

// 행운의 숫자 계산
function getLuckyNumber(dayMaster: HeavenlyStem, date: Date): number {
  const stemIndex = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(dayMaster)
  const dateNum = date.getDate()
  return ((stemIndex + dateNum) % 9) + 1 // 1-9 사이
}

// 오늘의 운세 계산
export function calculateTodayFortune(birthInfo: BirthInfo): FortuneResult {
  const userSaju = getSaju(birthInfo)
  const todaySaju = getTodaySaju()

  const dayMaster = getDayMaster(userSaju)
  const dayMasterElement = STEM_TO_ELEMENT[dayMaster]
  const todayElement = STEM_TO_ELEMENT[todaySaju.day.heavenlyStem]

  const relation = checkElementRelation(dayMasterElement, todayElement)
  const baseScore = getElementScore(relation)

  // 날짜 기반 약간의 변동 추가
  const today = new Date()
  const dateVariation = (today.getDate() % 10) - 5 // -5 ~ +4
  const overallScore = Math.max(40, Math.min(100, baseScore + dateVariation))

  // 카테고리별 점수 (기본 점수에서 변동)
  const categoryScores = {
    love: Math.max(40, Math.min(100, baseScore + ((today.getDate() * 3) % 20) - 10)),
    money: Math.max(40, Math.min(100, baseScore + ((today.getDate() * 7) % 20) - 10)),
    health: Math.max(40, Math.min(100, baseScore + ((today.getDate() * 11) % 20) - 10)),
    work: Math.max(40, Math.min(100, baseScore + ((today.getDate() * 13) % 20) - 10)),
  }

  const masterInfo = DAY_MASTER_MESSAGES[dayMaster]
  const elementTraits = ELEMENT_TRAITS[dayMasterElement]

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${weekdays[today.getDay()]}요일`

  return {
    date: dateStr,
    dayMaster,
    dayMasterElement,
    todayElement,
    overall: {
      score: overallScore,
      grade: getGrade(overallScore),
      summary: `${masterInfo.personality} 당신에게 ${relation === 'generated' ? '행운이 따르는' : relation === 'same' ? '안정적인' : relation === 'overcome' ? '조심해야 할' : '무난한'} 하루`,
      detail: `오늘은 ${todayElement}의 기운이 강한 날입니다. ${dayMasterElement}인 당신은 ${masterInfo.strength}이(가) 돋보이는 날이에요. ${masterInfo.advice}`,
    },
    categories: {
      love: {
        score: categoryScores.love,
        message: getElementMessage(relation, 'love'),
      },
      money: {
        score: categoryScores.money,
        message: getElementMessage(relation, 'money'),
      },
      health: {
        score: categoryScores.health,
        message: getElementMessage(relation, 'health'),
      },
      work: {
        score: categoryScores.work,
        message: getElementMessage(relation, 'work'),
      },
    },
    lucky: {
      color: elementTraits.luckyColor,
      number: getLuckyNumber(dayMaster, today),
      direction: elementTraits.direction,
      time: getLuckyTime(dayMasterElement),
    },
    advice: masterInfo.advice,
  }
}

// 포맷된 날짜 문자열
export function getFormattedDate(): string {
  const today = new Date()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${weekdays[today.getDay()]}요일`
}
