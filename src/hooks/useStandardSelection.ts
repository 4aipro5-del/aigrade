import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AchievementStandard } from '../types/database'

function storageKey(ownerKey: string, subject: string, term: string, grade: number) {
  return `aigrade:selected-standards:${ownerKey}:${subject}:${term}:grade-${grade}`
}

interface UseStandardSelectionResult {
  selectedCodes: string[]
  selectedCount: number
  toggleCode: (code: string) => void
  selectAll: () => void
  clearAll: () => void
  setSelectedCodes: (codes: string[]) => void
}

export function useStandardSelection(
  standards: AchievementStandard[],
  ownerKey: string,
  subject: string,
  term: string,
  grade: number,
): UseStandardSelectionResult {
  const [selectedCodes, setSelectedCodesState] = useState<string[]>([])

  const key = useMemo(
    () => storageKey(ownerKey, subject, term, grade),
    [grade, ownerKey, subject, term],
  )
  const availableCodes = useMemo(() => standards.map((standard) => standard.code), [standards])

  useEffect(() => {
    if (availableCodes.length === 0) {
      setSelectedCodesState([])
      return
    }

    const raw = window.localStorage.getItem(key)
    if (!raw) {
      setSelectedCodesState(availableCodes)
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        setSelectedCodesState(availableCodes)
        return
      }

      const next = parsed.filter(
        (code): code is string => typeof code === 'string' && availableCodes.includes(code),
      )
      setSelectedCodesState(next)
    } catch {
      setSelectedCodesState(availableCodes)
    }
  }, [availableCodes, key])

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(selectedCodes))
  }, [key, selectedCodes])

  const setSelectedCodes = useCallback(
    (codes: string[]) => {
      const next = codes.filter((code) => availableCodes.includes(code))
      setSelectedCodesState(Array.from(new Set(next)))
    },
    [availableCodes],
  )

  const toggleCode = useCallback((code: string) => {
    setSelectedCodesState((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedCodesState(availableCodes)
  }, [availableCodes])

  const clearAll = useCallback(() => {
    setSelectedCodesState([])
  }, [])

  return {
    selectedCodes,
    selectedCount: selectedCodes.length,
    toggleCode,
    selectAll,
    clearAll,
    setSelectedCodes,
  }
}
