import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import type { AchievementTemplate } from '../types/database'

interface UseAchievementTemplatesResult {
  templates: AchievementTemplate[]
  loading: boolean
  error: string | null
}

export function useAchievementTemplates(standardCodes: string[]): UseAchievementTemplatesResult {
  const [templates, setTemplates] = useState<AchievementTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codesKey = standardCodes.join(',')

  useEffect(() => {
    if (!isSupabaseConfigured || standardCodes.length === 0) {
      setTemplates([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('achievement_templates')
      .select('*')
      .in('standard_code', standardCodes)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setTemplates(data ?? [])
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey])

  return { templates, loading, error }
}
