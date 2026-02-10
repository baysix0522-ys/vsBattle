#!/usr/bin/env node
/**
 * 한자 사전 빌드 스크립트
 *
 * 데이터 소스:
 * - data-naver.csv: rutopio/Korean-Name-Hanja-Charset (MIT)
 * - Unihan.zip: Unicode Consortium (kTotalStrokes 획수 데이터)
 *
 * 출력:
 * - apps/frontend/src/lib/hanja/hanjaDict.json  (프론트엔드 사전)
 * - apps/backend/src/data/hanjaStrokes.json      (백엔드 획수 맵)
 */

import { writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { readFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const NAVER_CSV_URL =
  'https://raw.githubusercontent.com/rutopio/Korean-Name-Hanja-Charset/main/data-naver.csv'
const UNIHAN_ZIP_URL =
  'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip'

async function fetchText(url, label) {
  console.log(`[${label}] 다운로드 중: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${label} 다운로드 실패: ${res.status}`)
  const text = await res.text()
  console.log(`[${label}] 다운로드 완료 (${(text.length / 1024).toFixed(0)} KB)`)
  return text
}

async function fetchUnihanStrokes() {
  const tmpDir = resolve(tmpdir(), 'unihan-build')
  const zipPath = resolve(tmpDir, 'Unihan.zip')
  const extractDir = resolve(tmpDir, 'extracted')

  mkdirSync(tmpDir, { recursive: true })
  mkdirSync(extractDir, { recursive: true })

  // Unihan.zip 다운로드
  console.log(`[Unihan] 다운로드 중: ${UNIHAN_ZIP_URL}`)
  const res = await fetch(UNIHAN_ZIP_URL)
  if (!res.ok) throw new Error(`Unihan 다운로드 실패: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  writeFileSync(zipPath, buffer)
  console.log(`[Unihan] 다운로드 완료 (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)

  // PowerShell로 zip 해제
  console.log(`[Unihan] zip 해제 중...`)
  execSync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`,
    { stdio: 'pipe' }
  )

  // kTotalStrokes는 Unihan_IRGSources.txt에 있음
  const irgFile = resolve(extractDir, 'Unihan_IRGSources.txt')
  if (!existsSync(irgFile)) {
    const files = execSync(`dir "${extractDir}" /b`, { encoding: 'utf-8' })
    console.log('[Unihan] 추출된 파일:', files)
    throw new Error('Unihan_IRGSources.txt 파일을 찾을 수 없습니다')
  }

  const text = readFileSync(irgFile, 'utf-8')
  console.log(`[Unihan] IRGSources 읽기 완료 (${(text.length / 1024).toFixed(0)} KB)`)

  // 정리
  try {
    execSync(`powershell -Command "Remove-Item -Recurse -Force '${tmpDir}'"`, { stdio: 'pipe' })
  } catch { /* 정리 실패해도 무시 */ }

  return text
}

function parseNaverCsv(csvText) {
  const lines = csvText.trim().split('\n')
  const entries = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parts = line.split(',')
    if (parts.length < 5) continue
    entries.push({
      hangul: parts[0],
      unicode: parts[2],
      hanja: parts[3],
      meaning: parts[4],
    })
  }
  console.log(`[Naver] ${entries.length}개 엔트리 파싱 완료`)
  return entries
}

function parseUnihanStrokes(text) {
  const strokes = new Map()
  for (const line of text.split('\n')) {
    if (!line.startsWith('U+') || !line.includes('kTotalStrokes')) continue
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const cp = parts[0].replace('U+', '').toLowerCase()
    const count = parseInt(parts[2], 10)
    if (!isNaN(count)) {
      strokes.set(cp, count)
    }
  }
  console.log(`[Unihan] ${strokes.size}개 획수 데이터 파싱 완료`)
  return strokes
}

function buildDictionaries(naverEntries, unihanStrokes) {
  // 1. 중복 제거: (hangul, hanja) 기준
  const seen = new Set()
  const unique = []
  for (const entry of naverEntries) {
    const key = `${entry.hangul}:${entry.hanja}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(entry)
  }
  console.log(`[빌드] 중복 제거: ${naverEntries.length} → ${unique.length}개`)

  // 2. 획수 매핑
  let matched = 0
  let fallback = 0
  const frontendDict = {}
  const backendStrokes = {}

  for (const entry of unique) {
    const cp = entry.unicode.toLowerCase()
    let strokeCount = unihanStrokes.get(cp) || 0
    if (strokeCount > 0) {
      matched++
    } else {
      fallback++
    }

    if (!frontendDict[entry.hangul]) {
      frontendDict[entry.hangul] = []
    }
    frontendDict[entry.hangul].push({
      h: entry.hanja,
      m: entry.meaning,
      s: strokeCount,
    })

    if (strokeCount > 0) {
      backendStrokes[entry.hanja] = strokeCount
    }
  }

  console.log(`[빌드] 획수 매핑: ${matched}개 성공, ${fallback}개 미매칭 (0획으로 표시)`)
  console.log(`[빌드] 한글 음절 수: ${Object.keys(frontendDict).length}개`)
  console.log(`[빌드] 백엔드 획수 맵: ${Object.keys(backendStrokes).length}개`)

  return { frontendDict, backendStrokes }
}

async function main() {
  console.log('=== 한자 사전 빌드 시작 ===\n')

  // 병렬 다운로드
  const [naverCsv, unihanText] = await Promise.all([
    fetchText(NAVER_CSV_URL, 'Naver'),
    fetchUnihanStrokes(),
  ])

  // 파싱
  const naverEntries = parseNaverCsv(naverCsv)
  const unihanStrokes = parseUnihanStrokes(unihanText)

  // 사전 구축
  const { frontendDict, backendStrokes } = buildDictionaries(naverEntries, unihanStrokes)

  // 파일 출력
  const frontendPath = resolve(ROOT, 'apps/frontend/src/lib/hanja/hanjaDict.json')
  const backendPath = resolve(ROOT, 'apps/backend/src/data/hanjaStrokes.json')

  mkdirSync(dirname(frontendPath), { recursive: true })
  mkdirSync(dirname(backendPath), { recursive: true })

  writeFileSync(frontendPath, JSON.stringify(frontendDict), 'utf-8')
  writeFileSync(backendPath, JSON.stringify(backendStrokes), 'utf-8')

  const frontendSize = JSON.stringify(frontendDict).length
  const backendSize = JSON.stringify(backendStrokes).length
  console.log(`\n[출력] 프론트엔드 사전: ${frontendPath}`)
  console.log(`       크기: ${(frontendSize / 1024).toFixed(1)} KB`)
  console.log(`[출력] 백엔드 획수 맵: ${backendPath}`)
  console.log(`       크기: ${(backendSize / 1024).toFixed(1)} KB`)

  console.log('\n=== 빌드 완료 ===')
}

main().catch(err => {
  console.error('빌드 실패:', err)
  process.exit(1)
})
