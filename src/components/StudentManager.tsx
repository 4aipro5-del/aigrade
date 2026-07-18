import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { matchesExactStudentGrade } from '../lib/gradeGroup'
import { getDisplayName, setStudentName } from '../lib/studentNames'
import type { Student } from '../types/database'

interface StudentManagerProps {
  schoolYear: string
  semester: string
  selectedGrade: number
}

interface ParsedStudent {
  studentNo: string
  name: string
}

type Status =
  | { type: 'idle' }
  | { type: 'saving' }
  | { type: 'done'; message: string }
  | { type: 'error'; message: string }

function guessColumn(headers: string[], patterns: RegExp[]): number | null {
  const idx = headers.findIndex((h) => patterns.some((p) => p.test(h)))
  return idx === -1 ? null : idx
}

function columnLabel(header: string, index: number): string {
  return header.trim() !== '' ? header : `열 ${index + 1} (제목 없음)`
}

function compareTerms(a: string, b: string): number {
  const [aYear = '0', aSemester = ''] = a.split('-')
  const [bYear = '0', bSemester = ''] = b.split('-')
  const yearDiff = Number(bYear) - Number(aYear)

  if (yearDiff !== 0) return yearDiff
  if (aSemester === bSemester) return 0
  if (aSemester === '1학기') return -1
  if (bSemester === '1학기') return 1
  return aSemester.localeCompare(bSemester, 'ko')
}

export function StudentManager({ schoolYear, semester, selectedGrade }: StudentManagerProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [studentNoCol, setStudentNoCol] = useState<number | null>(null)
  const [nameCol, setNameCol] = useState<number | null>(null)
  const [grade, setGrade] = useState(String(selectedGrade))
  const [classNo, setClassNo] = useState('1')
  const [term, setTerm] = useState(`${schoolYear}-${semester}`)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [registeredStudents, setRegisteredStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTerm(`${schoolYear}-${semester}`)
  }, [schoolYear, semester])

  useEffect(() => {
    setGrade(String(selectedGrade))
  }, [selectedGrade])

  useEffect(() => {
    let cancelled = false

    async function loadStudents() {
      setLoadingStudents(true)
      setLoadError(null)

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        if (!cancelled) {
          setLoadError('로그인 정보를 확인하지 못했습니다.')
          setLoadingStudents(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', userData.user.id)
        .order('term', { ascending: false })
        .order('grade', { ascending: true })
        .order('class_no', { ascending: true })
        .order('student_no', { ascending: true })

      if (cancelled) return

      if (error) {
        setLoadError(error.message)
      } else {
        setRegisteredStudents(data ?? [])
      }
      setLoadingStudents(false)
    }

    loadStudents()
    return () => {
      cancelled = true
    }
  }, [status])

  const resetParsed = () => {
    setFileName(null)
    setHeaders([])
    setRows([])
    setStudentNoCol(null)
    setNameCol(null)
  }

  const handleFile = useCallback(async (file: File) => {
    setStatus({ type: 'idle' })
    setFileName(file.name)

    // CSV는 인코딩이 파일에 명시되어 있지 않아 ArrayBuffer로 읽으면 SheetJS가
    // UTF-8 한글을 잘못 해석할 수 있어(BOM 없는 경우) 텍스트로 직접 읽고,
    // xlsx/xls는 자체 포맷 내에 인코딩 정보가 있으므로 바이너리로 읽는다.
    const isCsv = file.name.toLowerCase().endsWith('.csv')
    const workbook = isCsv
      ? XLSX.read(await file.text(), { type: 'string' })
      : XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      blankrows: false,
    })

    if (data.length === 0) {
      setStatus({ type: 'error', message: '시트에서 데이터를 찾을 수 없습니다.' })
      return
    }

    const [headerRow, ...bodyRows] = data
    const stringHeaders = headerRow.map((cell) => String(cell ?? '').trim())
    const stringRows = bodyRows
      .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row) => stringHeaders.map((_, i) => String(row[i] ?? '').trim()))

    setHeaders(stringHeaders)
    setRows(stringRows)
    setStudentNoCol(guessColumn(stringHeaders, [/번호/, /학번/, /no\.?$/i]))
    setNameCol(guessColumn(stringHeaders, [/이름/, /성명/, /name/i]))
  }, [])

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const parsedStudents = useMemo<ParsedStudent[]>(() => {
    if (studentNoCol === null || nameCol === null) return []
    return rows
      .map((row) => ({
        studentNo: row[studentNoCol] ?? '',
        name: row[nameCol] ?? '',
      }))
      .filter((r) => r.studentNo !== '' || r.name !== '')
  }, [rows, studentNoCol, nameCol])

  const termOptions = useMemo(() => {
    const unique = Array.from(
      new Set([
        `${schoolYear}-1학기`,
        `${schoolYear}-2학기`,
        `${schoolYear}-${semester}`,
        ...registeredStudents.map((student) => student.term),
      ]),
    )
    return unique.sort(compareTerms)
  }, [registeredStudents, schoolYear, semester])

  const canSubmit =
    parsedStudents.length > 0 && classNo.trim() !== '' && grade.trim() !== '' && term.trim() !== ''

  const handleSubmit = async () => {
    setStatus({ type: 'saving' })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setStatus({ type: 'error', message: '로그인이 필요합니다. 먼저 로그인해 주세요.' })
      return
    }
    const teacherId = userData.user.id

    // 이름은 절대 이 payload에 포함하지 않음 — 서버에는 가명ID/학번/학년/반/학기만 전송
    const payload = parsedStudents.map((s, i) => ({
      teacher_id: teacherId,
      pseudo_label: s.studentNo || `익명${i + 1}`,
      grade: Number(grade),
      class_no: Number(classNo),
      student_no: s.studentNo ? Number(s.studentNo) : null,
      term,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('students')
      .insert(payload)
      .select()

    if (insertError || !inserted) {
      setStatus({ type: 'error', message: insertError?.message ?? '등록에 실패했습니다.' })
      return
    }

    inserted.forEach((row, i) => {
      const name = parsedStudents[i]?.name
      if (name) setStudentName(row.id, name)
    })

    setRegisteredStudents((prev) => [...inserted, ...prev])
    setStatus({ type: 'done', message: `${inserted.length}명 등록 완료` })
    resetParsed()
  }

  const visibleRegisteredStudents = useMemo(
    () =>
      registeredStudents.filter(
        (student) => student.term === term && matchesExactStudentGrade(student.grade, Number(grade)),
      ),
    [grade, registeredStudents, term],
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl border border-[#d8e3ef] bg-white p-5 shadow-[0_10px_24px_rgba(140,164,188,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">일괄 등록 대상 학급 정보</h2>
            <p className="mt-1 text-xs text-slate-500">
              여기서 선택한 학년과 학기로 업로드와 명단 조회가 함께 맞춰집니다.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 rounded-full border border-[#e0e7f0] bg-[#f1f8ee] px-3 py-2 text-sm text-slate-600">
            학년
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-20 rounded-full border border-[#d2dceb] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#bfd5ee]"
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value}학년
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-full border border-[#e0e7f0] bg-[#f8fbff] px-3 py-2 text-sm text-slate-600">
            반
            <input
              value={classNo}
              onChange={(e) => setClassNo(e.target.value)}
              className="w-16 rounded-full border border-[#d2dceb] px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#bfd5ee]"
            />
          </label>
          <label className="flex items-center gap-2 rounded-full border border-[#e0e7f0] bg-[#eef8f4] px-3 py-2 text-sm text-slate-600">
            학기
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-32 rounded-full border border-[#d1e6da] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#bfe6d0]"
            >
              {termOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-[#9ebde1] bg-[#f1f7ff]'
            : 'border-[#d6e1ed] bg-white hover:bg-[#f8fbff]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        <p className="text-sm text-slate-600">
          엑셀(.xlsx, .xls) 또는 CSV 파일을 이곳에 끌어다 놓거나 클릭해서 선택하세요.
        </p>
        {fileName && <p className="mt-2 text-xs text-slate-400">선택된 파일: {fileName}</p>}
      </section>

      {headers.length > 0 && (
        <section className="rounded-2xl border border-[#d8e3ef] bg-white p-5 shadow-[0_10px_24px_rgba(140,164,188,0.08)]">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">열 매핑</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 rounded-full border border-[#ece5fb] bg-[#faf7ff] px-3 py-2 text-sm text-slate-600">
              번호/학번 열
              <select
                value={studentNoCol ?? ''}
                onChange={(e) => setStudentNoCol(e.target.value === '' ? null : Number(e.target.value))}
                className="rounded-full border border-[#d9d1f0] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#d7c9f7]"
              >
                <option value="">선택 안 함</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {columnLabel(h, i)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-full border border-[#ece5fb] bg-[#faf7ff] px-3 py-2 text-sm text-slate-600">
              이름 열
              <select
                value={nameCol ?? ''}
                onChange={(e) => setNameCol(e.target.value === '' ? null : Number(e.target.value))}
                className="rounded-full border border-[#d9d1f0] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#d7c9f7]"
              >
                <option value="">선택 안 함</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {columnLabel(h, i)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      {parsedStudents.length > 0 && (
        <section className="rounded-2xl border border-[#d8e3ef] bg-white p-5 shadow-[0_10px_24px_rgba(140,164,188,0.08)]">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            미리보기 ({parsedStudents.length}명) — 등록 완료 전 검수용
          </h2>
          <div className="max-h-80 overflow-auto rounded-xl border border-[#e1e9f2]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-[#f8fbff]">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600">
                    번호/학번
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600">
                    이름 <span className="font-normal text-slate-400">(로컬에만 저장, 서버 미전송)</span>
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600">
                    저장될 가명ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsedStudents.map((s, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-700">{s.studentNo}</td>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-700">{s.name}</td>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-500">
                      {s.studentNo || `익명${i + 1}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#d8e3ef] bg-white p-5 shadow-[0_10px_24px_rgba(140,164,188,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">등록된 학생 조회</h2>
            <p className="mt-1 text-xs text-slate-500">
              위에서 고른 학년과 학기에 맞는 명단만 바로 보여줍니다.
            </p>
          </div>
          <div className="rounded-full border border-[#dfe8f1] bg-[#f8fbff] px-3 py-2 text-sm font-medium text-slate-600">
            {term} · {grade}학년
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[#e1e9f2]">
          {loadingStudents ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">불러오는 중...</div>
          ) : loadError ? (
            <div className="px-4 py-6 text-sm text-red-700">{loadError}</div>
          ) : visibleRegisteredStudents.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              현재 조회 조건에 등록된 학생이 없습니다.
            </div>
          ) : (
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[#f8fbff]">
                  <tr>
                    <th className="border-b border-[#e1e9f2] px-3 py-2 text-left font-medium text-slate-600">
                      학년/반
                    </th>
                    <th className="border-b border-[#e1e9f2] px-3 py-2 text-left font-medium text-slate-600">
                      번호
                    </th>
                    <th className="border-b border-[#e1e9f2] px-3 py-2 text-left font-medium text-slate-600">
                      화면 표시명
                    </th>
                    <th className="border-b border-[#e1e9f2] px-3 py-2 text-left font-medium text-slate-600">
                      학기
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRegisteredStudents.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 1 ? 'bg-[#fbfdff]' : 'bg-white'}>
                      <td className="border-b border-[#edf2f7] px-3 py-2 text-slate-700">
                        {student.grade ?? '-'}학년 {student.class_no ?? '-'}반
                      </td>
                      <td className="border-b border-[#edf2f7] px-3 py-2 text-slate-700">
                        {student.student_no ?? student.pseudo_label}
                      </td>
                      <td className="border-b border-[#edf2f7] px-3 py-2 text-slate-700">
                        {getDisplayName(student.id, student.pseudo_label)}
                      </td>
                      <td className="border-b border-[#edf2f7] px-3 py-2 text-slate-500">
                        {student.term}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {status.type === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {status.message}
        </div>
      )}
      {status.type === 'done' && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {status.message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canSubmit || status.type === 'saving'}
          onClick={handleSubmit}
          className="rounded-full bg-[#2c5d93] px-4 py-2 text-sm font-medium text-white hover:bg-[#244f80] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status.type === 'saving' ? '등록 중...' : '등록 완료'}
        </button>
      </div>
    </div>
  )
}
