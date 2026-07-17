import { useCallback, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { setStudentName } from '../lib/studentNames'

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

export function StudentManager() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [studentNoCol, setStudentNoCol] = useState<number | null>(null)
  const [nameCol, setNameCol] = useState<number | null>(null)
  const [grade, setGrade] = useState('6')
  const [classNo, setClassNo] = useState('1')
  const [term, setTerm] = useState('2026-1학기')
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const canSubmit =
    parsedStudents.length > 0 && grade.trim() !== '' && classNo.trim() !== '' && term.trim() !== ''

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

    setStatus({ type: 'done', message: `${inserted.length}명 등록 완료` })
    resetParsed()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">일괄 등록 대상 학급 정보</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            학년
            <input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            반
            <input
              value={classNo}
              onChange={(e) => setClassNo(e.target.value)}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            학기
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
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
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-white hover:bg-slate-50'
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
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">열 매핑</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              번호/학번 열
              <select
                value={studentNoCol ?? ''}
                onChange={(e) => setStudentNoCol(e.target.value === '' ? null : Number(e.target.value))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">선택 안 함</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {columnLabel(h, i)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              이름 열
              <select
                value={nameCol ?? ''}
                onChange={(e) => setNameCol(e.target.value === '' ? null : Number(e.target.value))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            미리보기 ({parsedStudents.length}명) — 등록 완료 전 검수용
          </h2>
          <div className="max-h-80 overflow-auto rounded-md border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
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
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status.type === 'saving' ? '등록 중...' : '등록 완료'}
        </button>
      </div>
    </div>
  )
}
