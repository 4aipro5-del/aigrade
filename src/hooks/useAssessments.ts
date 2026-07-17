import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type AssessmentStatus = 'draft' | 'final'

interface AssessmentRecord {
  generatedComment: string
  status: AssessmentStatus
  updatedAt: string
}

interface UseAssessmentsResult {
  records: Record<string, AssessmentRecord | undefined>
  loading: boolean
  error: string | null
  saveAssessment: (
    studentId: string,
    generatedComment: string,
    status: AssessmentStatus,
  ) => Promise<string | null>
}

// 종합의견 확정/저장 상태(assessments 테이블)를 학생별로 관리하는 훅.
// generateReportComment의 실시간 계산 결과와는 별개로, 교사가 명시적으로
// "저장"/"확정"을 눌렀을 때만 이 테이블에 기록됨.
export function useAssessments(
  studentIds: string[],
  subject: string,
  term: string,
): UseAssessmentsResult {
  const [records, setRecords] = useState<Record<string, AssessmentRecord | undefined>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idsKey = studentIds.join(',')

  useEffect(() => {
    if (!isSupabaseConfigured || studentIds.length === 0) {
      setRecords({})
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('assessments')
      .select('student_id, generated_comment, status, updated_at')
      .in('student_id', studentIds)
      .eq('subject', subject)
      .eq('term', term)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          const next: Record<string, AssessmentRecord> = {}
          for (const row of data ?? []) {
            next[row.student_id] = {
              generatedComment: row.generated_comment ?? '',
              status: row.status as AssessmentStatus,
              updatedAt: row.updated_at,
            }
          }
          setRecords(next)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, subject, term])

  const saveAssessment = useCallback(
    async (studentId: string, generatedComment: string, status: AssessmentStatus) => {
      const { error: upsertError } = await supabase.from('assessments').upsert(
        {
          student_id: studentId,
          subject,
          term,
          generated_comment: generatedComment,
          status,
        },
        { onConflict: 'student_id,subject,term' },
      )

      if (upsertError) {
        return upsertError.message
      }

      setRecords((prev) => ({
        ...prev,
        [studentId]: {
          generatedComment,
          status,
          updatedAt: new Date().toISOString(),
        },
      }))
      return null
    },
    [subject, term],
  )

  return { records, loading, error, saveAssessment }
}
