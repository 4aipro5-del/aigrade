import type { GradeGroupFilter } from '../types/database'

const GRADE_GROUP_RANGES: Record<Exclude<GradeGroupFilter, 'all'>, readonly number[]> = {
  '1-2': [1, 2],
  '3-4': [3, 4],
  '5-6': [5, 6],
}

export function getGradeGroupForGrade(grade: number): Exclude<GradeGroupFilter, 'all'> {
  if (grade <= 2) return '1-2'
  if (grade <= 4) return '3-4'
  return '5-6'
}

export function matchesStandardGradeGroup(gradeLabel: string, gradeGroup: GradeGroupFilter) {
  if (gradeGroup === 'all') return true

  const normalized = gradeLabel.replace(/\s/g, '').replace(/~/g, '-')
  const explicitRange = `${gradeGroup}학년군`
  if (normalized.includes(explicitRange)) return true

  const grades = Array.from(normalized.matchAll(/([1-6])학년/g)).map((match) => Number(match[1]))
  return grades.some((grade) => GRADE_GROUP_RANGES[gradeGroup].includes(grade))
}

export function matchesStudentGrade(grade: number | null, gradeGroup: GradeGroupFilter) {
  if (gradeGroup === 'all' || grade === null) return true
  return GRADE_GROUP_RANGES[gradeGroup].includes(grade)
}

export function matchesExactStudentGrade(grade: number | null, selectedGrade: number) {
  if (grade === null) return false
  return grade === selectedGrade
}
