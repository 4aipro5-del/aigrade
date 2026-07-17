export type AchievementLevel = '매우잘함' | '잘함' | '보통'

export interface Student {
  id: string
  teacher_id: string
  pseudo_label: string
  grade: number | null
  class_no: number | null
  student_no: number | null
  term: string
  created_at: string
}

export interface AchievementStandard {
  code: string
  subject: string
  domain: string | null
  grade: string
  description: string
}

export interface AssessmentItem {
  id: string
  student_id: string
  standard_code: string
  level: AchievementLevel
  note: string | null
  created_at: string
}

export interface AchievementTemplate {
  id: string
  standard_code: string
  level: AchievementLevel
  variant_no: number
  template_text: string
}
