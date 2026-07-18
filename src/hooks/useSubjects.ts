import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { matchesStandardGradeGroup } from '../lib/gradeGroup'
import type { GradeGroupFilter } from '../types/database'

interface UseSubjectsResult {
  subjects: string[]
  loading: boolean
  error: string | null
}

// achievement_standards에 실제로 등록된 교과만 동적으로 노출한다.
// 하드코딩된 과목 목록을 두지 않아, 사용자가 직접 큐레이션한 성취기준
// 데이터(학년군별 등)를 얼마든지 늘리거나 바꿔도 화면이 그대로 따라간다.
export function useSubjects(gradeGroup: GradeGroupFilter): UseSubjectsResult {
  const [subjects, setSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('achievement_standards')
      .select('subject, grade')
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          const filtered = (data ?? []).filter((row) =>
            matchesStandardGradeGroup(row.grade, gradeGroup),
          )
          const unique = Array.from(new Set(filtered.map((row) => row.subject))).sort((a, b) =>
            a.localeCompare(b, 'ko'),
          )
          setSubjects(unique)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [gradeGroup])

  return { subjects, loading, error }
}
