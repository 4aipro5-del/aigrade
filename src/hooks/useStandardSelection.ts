import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { AchievementStandard } from '../types/database'

interface UseStandardSelectionResult {
  selectedCodes: string[]
  selectedCount: number
  toggleCode: (code: string) => void
  selectAll: () => void
  clearAll: () => void
  setSelectedCodes: (codes: string[]) => void
  loading: boolean
  saving: boolean
  isDirty: boolean
  save: () => Promise<void>
  saveError: string | null
  lastSavedAt: string | null
  // 같은 학년도의 "다른 학기"에 이미 선택돼 있던 코드 → 그 학기(들) 라벨 목록.
  // 예: { '6국01-01': ['1학기'] }. 없으면 빈 객체.
  otherTermSelections: Record<string, string[]>
}

function splitTerm(term: string): { schoolYear: string; semester: string } {
  const [schoolYear = '', ...rest] = term.split('-')
  return { schoolYear, semester: rest.join('-') || term }
}

export function useStandardSelection(
  standards: AchievementStandard[],
  ownerKey: string,
  subject: string,
  term: string,
  grade: number,
): UseStandardSelectionResult {
  const [selectedCodes, setSelectedCodesState] = useState<string[]>([])
  const [savedCodes, setSavedCodes] = useState<string[] | null>(null)
  // isDirty의 근거는 "저장된 배열과 현재 배열을 비교"가 아니라, 이 플래그를
  // 직접 스위치하는 방식이다. 체크 해제로 배열 길이가 줄거나 완전히 비워지는
  // 경우도 비교 로직의 미묘한 버그 없이 100% 확실하게 잡아내기 위함.
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const availableCodes = useMemo(() => standards.map((standard) => standard.code), [standards])
  const { schoolYear } = useMemo(() => splitTerm(term), [term])

  const [otherTermRows, setOtherTermRows] = useState<
    Array<{ term: string; standard_codes: string[] }>
  >([])

  // 같은 학년도의 다른 학기에 저장된 선택 내역을 함께 조회한다. 이 결과는
  // "안내용" 정보일 뿐이므로 실패하더라도 메인 선택/저장 기능에는 영향을 주지 않는다.
  useEffect(() => {
    let cancelled = false

    if (!ownerKey || !subject || !schoolYear) {
      setOtherTermRows([])
      return
    }

    async function loadOtherTerms() {
      const { data, error } = await supabase
        .from('standard_selections')
        .select('term, standard_codes')
        .eq('teacher_id', ownerKey)
        .eq('subject', subject)
        .eq('grade', grade)
        .like('term', `${schoolYear}-%`)

      if (cancelled) return
      if (error) {
        setOtherTermRows([])
        return
      }
      setOtherTermRows(data ?? [])
    }

    loadOtherTerms()
    return () => {
      cancelled = true
    }
  }, [ownerKey, subject, grade, schoolYear])

  const otherTermSelections = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const row of otherTermRows) {
      if (row.term === term) continue // 현재 보고 있는 학기 자신은 제외
      const { semester } = splitTerm(row.term)
      for (const code of row.standard_codes) {
        const labels = map[code] ?? (map[code] = [])
        if (!labels.includes(semester)) labels.push(semester)
      }
    }
    return map
  }, [otherTermRows, term])

  // 교사/교과/학기/학년 조합이 바뀔 때마다 서버에 저장된 선택 내역을 불러온다.
  useEffect(() => {
    let cancelled = false

    if (!ownerKey || !subject || !term) {
      setLoading(false)
      return
    }

    setLoading(true)
    setSaveError(null)

    async function load() {
      // maybeSingle() 대신 최신 1건만 명시적으로 가져온다. 과거에 중복 행이
      // 생겼거나 unique 제약이 없던 상태로 저장된 적이 있어도(예: 마이그레이션
      // 적용 전 테스트 데이터) "여러 행" 에러로 조회 자체가 실패하는 일이
      // 없도록 하기 위함 — 그 경우 선택 내역이 매번 초기화되어 버그처럼 보일 수 있음.
      const { data, error } = await supabase
        .from('standard_selections')
        .select('standard_codes, updated_at')
        .eq('teacher_id', ownerKey)
        .eq('subject', subject)
        .eq('term', term)
        .eq('grade', grade)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (cancelled) return

      if (error) {
        setSaveError(error.message)
        setSavedCodes(null)
        setHasUnsavedChanges(true)
        setLoading(false)
        return
      }

      const row = data?.[0] ?? null

      if (row) {
        setSavedCodes(row.standard_codes)
        setSelectedCodesState(row.standard_codes)
        setLastSavedAt(row.updated_at)
        setHasUnsavedChanges(false)
      } else {
        setSavedCodes(null)
        setLastSavedAt(null)
        setHasUnsavedChanges(true)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ownerKey, subject, term, grade])

  // 아직 한 번도 저장된 적이 없는 조합이면, 성취기준 목록이 도착할 때마다
  // "기본값 = 전체 선택" 상태를 유지한다. 저장된 내역이 있으면 이 로직은
  // 개입하지 않는다(사용자가 저장 전 편집 중인 내용을 덮어쓰지 않기 위함).
  useEffect(() => {
    if (loading) return
    if (savedCodes !== null) return
    setSelectedCodesState(availableCodes)
    setHasUnsavedChanges(true)
  }, [availableCodes, loading, savedCodes])

  const isDirty = hasUnsavedChanges

  const save = useCallback(async () => {
    setSaving(true)
    setSaveError(null)

    // standard_codes를 그대로 덮어쓰는 UPSERT. ignoreDuplicates: false를 명시해
    // 충돌 시 반드시 UPDATE(전체 컬럼 교체)가 일어나도록 하며, 배열이 줄거나
    // 빈 배열이 되는 경우에도 이전 값이 남지 않고 깨끗하게 교체된다.
    const { error } = await supabase.from('standard_selections').upsert(
      {
        teacher_id: ownerKey,
        subject,
        term,
        grade,
        standard_codes: selectedCodes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'teacher_id,subject,term,grade', ignoreDuplicates: false },
    )

    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return
    }

    setSavedCodes(selectedCodes)
    setHasUnsavedChanges(false)
    setLastSavedAt(new Date().toISOString())
  }, [ownerKey, subject, term, grade, selectedCodes])

  const setSelectedCodes = useCallback((codes: string[]) => {
    setSelectedCodesState(Array.from(new Set(codes)))
    setHasUnsavedChanges(true)
  }, [])

  const toggleCode = useCallback((code: string) => {
    setSelectedCodesState((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    )
    setHasUnsavedChanges(true)
  }, [])

  const selectAll = useCallback(() => {
    setSelectedCodesState(availableCodes)
    setHasUnsavedChanges(true)
  }, [availableCodes])

  const clearAll = useCallback(() => {
    setSelectedCodesState([])
    setHasUnsavedChanges(true)
  }, [])

  return {
    selectedCodes,
    selectedCount: selectedCodes.length,
    toggleCode,
    selectAll,
    clearAll,
    setSelectedCodes,
    loading,
    saving,
    isDirty,
    save,
    saveError,
    lastSavedAt,
    otherTermSelections,
  }
}
