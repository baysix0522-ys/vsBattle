import type { HanjaDict, HanjaDictEntry } from './types'

let dictCache: HanjaDict | null = null

export async function loadHanjaDict(): Promise<HanjaDict> {
  if (dictCache) return dictCache
  const mod = await import('./hanjaDict.json')
  dictCache = mod.default as HanjaDict
  return dictCache
}

export function lookupHanja(dict: HanjaDict, syllable: string): HanjaDictEntry[] {
  return dict[syllable] || []
}

export function getHanjaCandidates(
  dict: HanjaDict,
  koreanName: string
): Array<{ korean: string; candidates: HanjaDictEntry[] }> {
  return koreanName.split('').map(char => ({
    korean: char,
    candidates: lookupHanja(dict, char),
  }))
}

export type { HanjaDict, HanjaDictEntry }
