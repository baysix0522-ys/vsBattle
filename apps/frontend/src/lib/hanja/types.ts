export type HanjaDictEntry = {
  h: string // 한자
  m: string // 뜻 (예: "아름다울 가")
  s: number // 획수
}

export type HanjaDict = Record<string, HanjaDictEntry[]>
