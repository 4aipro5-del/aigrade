import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { getGradeGroupForGrade, matchesExactStudentGrade, matchesStandardGradeGroup } from '../lib/gradeGroup'
import type {
  AchievementLevel,
  AchievementStandard,
  AssessmentItem,
  Student,
} from '../types/database'

export function cellKey(studentId: string, standardCode: string) {
  return `${studentId}::${standardCode}`
}

interface CellState {
  level: AchievementLevel
  note: string | null
}

type CellMap = Record<string, CellState | undefined>

interface UseAssessmentGridResult {
  students: Student[]
  standards: AchievementStandard[]
  loading: boolean
  error: string | null
  getLevel: (studentId: string, standardCode: string) => AchievementLevel | undefined
  getNote: (studentId: string, standardCode: string) => string | undefined
  setLevel: (studentId: string, standardCode: string, level: AchievementLevel) => void
  setNote: (studentId: string, standardCode: string, note: string) => void
}

// 성취기준 x 학생 그리드의 데이터 로딩과 셀 상태를 함께 관리하는 훅.
// RLS가 teacher_id = auth.uid()로 students를 걸러주므로 별도 필터는 필요 없음.
export function useAssessmentGrid(
  subject: string,
  term: string,
  grade: number,
): UseAssessmentGridResult {
  const [students, setStudents] = useState<Student[]>([])
  const [standards, setStandards] = useState<AchievementStandard[]>([])
  const [cells, setCells] = useState<CellMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      if (!isSupabaseConfigured) {
        setError(
          'Supabase 연결 정보가 없습니다. .env.example을 참고해 .env 파일에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 설정해 주세요.',
        )
        setStudents([])
        setStandards([])
        setCells({})
        setLoading(false)
        return
      }

      try {
        await loadFromSupabase()
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.')
        setLoading(false)
      }
    }

    async function loadFromSupabase() {
      const [studentsRes, standardsRes] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .eq('term', term)
          .order('grade', { ascending: true })
          .order('class_no', { ascending: true })
          .order('student_no', { ascending: true }),
        supabase
          .from('achievement_standards')
          .select('*')
          .eq('subject', subject)
          .order('code', { ascending: true }),
      ])

      if (cancelled) return

      if (studentsRes.error || standardsRes.error) {
        setError(
          studentsRes.error?.message ??
            standardsRes.error?.message ??
            '데이터를 불러오지 못했습니다.',
        )
        setLoading(false)
        return
      }

      const gradeGroup = getGradeGroupForGrade(grade)
      const loadedStudents = (studentsRes.data ?? []).filter((student) =>
        matchesExactStudentGrade(student.grade, grade),
      )
      const loadedStandards = (standardsRes.data ?? []).filter((standard) =>
        matchesStandardGradeGroup(standard.grade, gradeGroup),
      )
      setStudents(loadedStudents)
      setStandards(loadedStandards)

      if (loadedStudents.length === 0 || loadedStandards.length === 0) {
        setCells({})
        setLoading(false)
        return
      }

      const itemsRes = await supabase
        .from('assessment_items')
        .select('*')
        .in('student_id', loadedStudents.map((s) => s.id))
        .in('standard_code', loadedStandards.map((s) => s.code))

      if (cancelled) return

      if (itemsRes.error) {
        setError(itemsRes.error.message)
        setLoading(false)
        return
      }

      const nextCells: CellMap = {}
      for (const item of (itemsRes.data ?? []) as AssessmentItem[]) {
        nextCells[cellKey(item.student_id, item.standard_code)] = {
          level: item.level,
          note: item.note,
        }
      }
      setCells(nextCells)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [grade, subject, term])

  const getLevel = useCallback(
    (studentId: string, standardCode: string) => cells[cellKey(studentId, standardCode)]?.level,
    [cells],
  )

  const getNote = useCallback(
    (studentId: string, standardCode: string) =>
      cells[cellKey(studentId, standardCode)]?.note ?? undefined,
    [cells],
  )

  const setLevel = useCallback(
    (studentId: string, standardCode: string, level: AchievementLevel) => {
      const key = cellKey(studentId, standardCode)
      setCells((prev) => ({ ...prev, [key]: { level, note: prev[key]?.note ?? null } }))

      supabase
        .from('assessment_items')
        .upsert(
          { student_id: studentId, standard_code: standardCode, level },
          { onConflict: 'student_id,standard_code' },
        )
        .then(({ error: upsertError }) => {
          if (upsertError) {
            console.error('성취수준 저장 실패:', upsertError.message)
          }
        })
    },
    [],
  )

  const setNote = useCallback(
    (studentId: string, standardCode: string, note: string) => {
      const key = cellKey(studentId, standardCode)
      const existingLevel = cells[key]?.level
      // 성취수준이 없으면 assessment_items.level(not null) 제약 때문에 저장할 수 없음
      if (!existingLevel) return

      const trimmed = note.trim() === '' ? null : note
      setCells((prev) => ({ ...prev, [key]: { level: existingLevel, note: trimmed } }))

      supabase
        .from('assessment_items')
        .upsert(
          { student_id: studentId, standard_code: standardCode, level: existingLevel, note: trimmed },
          { onConflict: 'student_id,standard_code' },
        )
        .then(({ error: upsertError }) => {
          if (upsertError) {
            console.error('메모 저장 실패:', upsertError.message)
          }
        })
    },
    [cells],
  )

  return { students, standards, loading, error, getLevel, getNote, setLevel, setNote }
}
