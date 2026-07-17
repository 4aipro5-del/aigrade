import type { AchievementLevel, AchievementStandard, AchievementTemplate } from '../types/database'

function templateKey(standardCode: string, level: AchievementLevel) {
  return `${standardCode}::${level}`
}

export function buildTemplateLookup(templates: AchievementTemplate[]): Map<string, string[]> {
  const lookup = new Map<string, string[]>()
  for (const t of templates) {
    const key = templateKey(t.standard_code, t.level)
    const list = lookup.get(key) ?? []
    list.push(t.template_text)
    lookup.set(key, list)
  }
  return lookup
}

// 같은 (성취기준, 성취수준) variant 여러 개 중 하나를 결정적으로 고른다.
// Math.random을 쓰면 재렌더링마다 문장이 바뀌어 보이므로, 학생+성취기준 조합을
// 해시해서 항상 같은 variant가 나오게 한다.
function pickVariant(variants: string[], seed: string): string {
  if (variants.length === 0) return ''
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return variants[hash % variants.length]
}

function appendNote(sentence: string, note: string | undefined): string {
  if (!note || note.trim() === '') return sentence
  const trimmedNote = note.trim()
  const withEnding = /[.!?]$/.test(trimmedNote) ? trimmedNote : `${trimmedNote}.`
  return sentence ? `${sentence} ${withEnding}` : withEnding
}

interface GenerateReportCommentArgs {
  studentId: string
  standards: AchievementStandard[]
  getLevel: (studentId: string, standardCode: string) => AchievementLevel | undefined
  getNote: (studentId: string, standardCode: string) => string | undefined
  templateLookup: Map<string, string[]>
}

// 선택된 성취기준 각각에 대해 템플릿 문장(주어 없는 술어형)을 고르고,
// 교사 메모가 있으면 문장 뒤에 이어 붙여 하나의 문단으로 합친다.
// 결과 텍스트에는 실명/플레이스홀더가 전혀 포함되지 않는다 — 이름은 화면에서
// 별도 라벨로만 붙는다.
export function generateReportComment({
  studentId,
  standards,
  getLevel,
  getNote,
  templateLookup,
}: GenerateReportCommentArgs): string {
  const sentences: string[] = []

  for (const standard of standards) {
    const level = getLevel(studentId, standard.code)
    if (!level) continue

    const variants = templateLookup.get(templateKey(standard.code, level)) ?? []
    if (variants.length === 0) continue

    const sentence = pickVariant(variants, `${studentId}::${standard.code}`)
    const note = getNote(studentId, standard.code)
    sentences.push(appendNote(sentence, note))
  }

  return sentences.join(' ')
}
