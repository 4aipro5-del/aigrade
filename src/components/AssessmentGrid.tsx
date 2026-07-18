import { useMemo, useState } from 'react'
import type { AchievementLevel, AchievementStandard, Student } from '../types/database'
import { getDisplayName } from '../lib/studentNames'

const ALL_DOMAINS = '전체'

const LEVELS: AchievementLevel[] = ['매우잘함', '잘함', '보통']

const LEVEL_STYLES: Record<AchievementLevel, string> = {
  매우잘함: 'bg-blue-50 text-blue-700',
  잘함: 'bg-green-50 text-green-700',
  보통: 'bg-orange-50 text-orange-700',
}

interface AssessmentGridProps {
  students: Student[]
  standards: AchievementStandard[]
  getLevel: (studentId: string, standardCode: string) => AchievementLevel | undefined
  getNote: (studentId: string, standardCode: string) => string | undefined
  onChangeLevel: (studentId: string, standardCode: string, level: AchievementLevel) => void
  onChangeNote: (studentId: string, standardCode: string, note: string) => void
}

interface EditingCell {
  studentId: string
  standardCode: string
}

export function AssessmentGrid({
  students,
  standards,
  getLevel,
  getNote,
  onChangeLevel,
  onChangeNote,
}: AssessmentGridProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [selectedDomain, setSelectedDomain] = useState(ALL_DOMAINS)

  const domains = useMemo(() => {
    const unique = Array.from(
      new Set(standards.map((s) => s.domain).filter((d): d is string => Boolean(d))),
    )
    return [ALL_DOMAINS, ...unique]
  }, [standards])

  // 교과가 바뀌어 domains 목록이 달라지면, 더 이상 존재하지 않는 선택값은
  // 자동으로 '전체'로 취급한다 (별도 리셋 effect 없이 파생값으로 처리).
  const activeDomain = domains.includes(selectedDomain) ? selectedDomain : ALL_DOMAINS

  const visibleStandards = useMemo(
    () => (activeDomain === ALL_DOMAINS ? standards : standards.filter((s) => s.domain === activeDomain)),
    [standards, activeDomain],
  )

  if (students.length === 0 || standards.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        표시할 학생 또는 성취기준이 없습니다.
      </div>
    )
  }

  const openNoteEditor = (studentId: string, standardCode: string) => {
    setDraftNote(getNote(studentId, standardCode) ?? '')
    setEditingCell({ studentId, standardCode })
  }

  const closeNoteEditor = () => setEditingCell(null)

  const saveNoteEditor = () => {
    if (!editingCell) return
    onChangeNote(editingCell.studentId, editingCell.standardCode, draftNote)
    setEditingCell(null)
  }

  const editingStandard = editingCell
    ? standards.find((s) => s.code === editingCell.standardCode)
    : undefined
  const editingStudent = editingCell
    ? students.find((s) => s.id === editingCell.studentId)
    : undefined

  return (
    <div className="space-y-3">
      {domains.length > 1 && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#d8e3ef] bg-white px-3 py-3 shadow-[0_10px_22px_rgba(142,167,193,0.08)]">
          {domains.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => setSelectedDomain(domain)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeDomain === domain
                  ? 'border-[#cfdcf5] bg-[#ecf4ff] text-[#315c96] shadow-sm'
                  : 'border-[#e2e9f1] bg-[#fafcff] text-slate-600 hover:bg-[#f1f6fb]'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-[75vh] overflow-auto rounded-2xl border border-[#d8e2ee] bg-white shadow-[0_12px_28px_rgba(136,162,187,0.10)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-30 min-w-[170px] border-b border-r border-[#d8e3ef] bg-[#f8fbff] px-4 py-4 text-left font-semibold text-[#35557d] shadow-[0_1px_0_0_#d8e3ef]"
              >
                학생
              </th>
              {visibleStandards.map((standard) => (
                <th
                  key={standard.code}
                  scope="col"
                  className="sticky top-0 z-20 min-w-[220px] border-b border-r border-[#d8e3ef] bg-[#f8fbff]/95 px-5 py-4 text-left align-top font-medium text-[#35557d] backdrop-blur last:border-r-0"
                  title={standard.description}
                >
                  <div className="font-mono text-[12px] font-semibold tracking-wide text-[#7d92b1]">
                    {standard.code}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[14px] font-medium leading-6 text-slate-700">
                    {standard.description}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, rowIndex) => {
              const rowBg = rowIndex % 2 === 1 ? 'bg-[#fbfdff]' : 'bg-white'
              return (
                <tr key={student.id} className={rowBg}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-b border-r border-[#e1eaf3] ${rowBg} px-4 py-4 text-left align-top text-[15px] font-semibold text-slate-700`}
                  >
                    {getDisplayName(student.id, student.pseudo_label)}
                  </th>
                  {visibleStandards.map((standard) => {
                    const level = getLevel(student.id, standard.code)
                    const note = getNote(student.id, standard.code)
                    const canEditNote = Boolean(level)
                    return (
                      <td
                        key={standard.code}
                        className="border-b border-r border-[#e1eaf3] p-0 align-top last:border-r-0"
                      >
                        <div className="flex min-h-[92px] flex-col">
                          <select
                            value={level ?? ''}
                            onChange={(e) =>
                              onChangeLevel(
                                student.id,
                                standard.code,
                                e.target.value as AchievementLevel,
                              )
                            }
                            className={`min-h-[54px] w-full cursor-pointer border-0 px-4 py-3 text-[15px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#b8d0ec] ${
                              level ? LEVEL_STYLES[level] : 'bg-white text-slate-400'
                            }`}
                          >
                            <option value="" disabled>
                              성취수준 선택
                            </option>
                            {LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={!canEditNote}
                            onClick={() => openNoteEditor(student.id, standard.code)}
                            title={level ? '메모 추가/수정' : '성취수준을 먼저 선택하세요'}
                            className={`relative flex min-h-[38px] items-center justify-between gap-3 border-t px-4 py-2 text-left transition ${
                              canEditNote
                                ? note
                                  ? 'border-[#d6e2f1] bg-[#f7fbff] hover:bg-[#eff6fd]'
                                  : 'border-[#dbe5ef] bg-[#fafcff] hover:bg-[#f2f7fb]'
                                : 'border-[#edf1f5] bg-[#fafbfd] text-slate-400'
                            } disabled:cursor-not-allowed`}
                          >
                            {note && (
                              <span
                                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#6a9ad6] ring-2 ring-white"
                                aria-hidden="true"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] font-semibold text-slate-500">
                                메모
                              </div>
                              <div
                                className={`mt-0.5 truncate text-xs ${
                                  note
                                    ? 'font-medium text-slate-700'
                                    : canEditNote
                                      ? 'text-slate-500'
                                      : 'text-slate-400'
                                }`}
                              >
                                {note ? note : ''}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium ${
                                note
                                  ? 'border-[#c7d8ea] bg-white text-[#4f6f97]'
                                  : canEditNote
                                    ? 'border-[#d7e1ec] bg-white text-slate-600'
                                    : 'border-[#e5ebf2] bg-white text-slate-400'
                              }`}
                            >
                              {note ? '수정' : canEditNote ? '+' : '-'}
                            </span>
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {editingCell && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
            onClick={closeNoteEditor}
          >
            <div
              className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2">
                <div className="text-sm font-medium text-slate-800">
                  {editingStudent && getDisplayName(editingStudent.id, editingStudent.pseudo_label)}
                </div>
                <div className="text-xs text-slate-400">
                  {editingStandard?.code} · {editingStandard?.description}
                </div>
              </div>
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                autoFocus
                rows={4}
                placeholder="이 성취기준에 대한 추가 메모 (선택)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeNoteEditor}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={saveNoteEditor}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
