import { useState } from 'react'
import type { AchievementLevel, AchievementStandard, Student } from '../types/database'
import { getDisplayName } from '../lib/studentNames'

const LEVELS: AchievementLevel[] = ['매우잘함', '잘함', '보통']

const LEVEL_STYLES: Record<AchievementLevel, string> = {
  매우잘함: 'bg-emerald-50 text-emerald-900',
  잘함: 'bg-sky-50 text-sky-900',
  보통: 'bg-slate-100 text-slate-700',
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
    <div className="max-h-[75vh] overflow-auto rounded-sm border border-[#b7c9dd] bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 top-0 z-20 min-w-[160px] border-b border-r border-[#c8d5e3] bg-[#edf4fb] px-4 py-3 text-left font-semibold text-[#35557d]"
            >
              학생
            </th>
            {standards.map((standard) => (
              <th
                key={standard.code}
                scope="col"
                className="sticky top-0 z-10 min-w-[240px] border-b border-r border-[#c8d5e3] bg-[#edf4fb] px-5 py-3 text-left align-top font-medium text-[#35557d] last:border-r-0"
                title={standard.description}
              >
                <div className="font-mono text-[12px] font-semibold text-[#6f86a6]">
                  {standard.code}
                </div>
                <div className="mt-1 line-clamp-2 text-[15px] leading-6 text-slate-700">
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
                  className={`sticky left-0 z-10 border-b border-r border-[#d4e0ec] ${rowBg} px-4 py-4 text-left align-top text-[15px] font-semibold text-slate-700`}
                >
                  {getDisplayName(student.id, student.pseudo_label)}
                </th>
                {standards.map((standard) => {
                  const level = getLevel(student.id, standard.code)
                  const note = getNote(student.id, standard.code)
                  const canEditNote = Boolean(level)
                  return (
                    <td
                      key={standard.code}
                      className="border-b border-r border-[#d4e0ec] p-0 align-top last:border-r-0"
                    >
                      <div className="flex min-h-[96px] flex-col">
                        <select
                          value={level ?? ''}
                          onChange={(e) =>
                            onChangeLevel(student.id, standard.code, e.target.value as AchievementLevel)
                          }
                          className={`min-h-[56px] w-full cursor-pointer border-0 px-5 py-3 text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6e97c6] ${
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
                          className={`flex min-h-[40px] items-center justify-between gap-3 border-t px-4 py-2 text-left ${
                            canEditNote
                              ? 'border-[#d9e4ef] bg-[#f8fafc] hover:bg-[#eef4fa]'
                              : 'border-[#edf1f5] bg-[#fafbfd] text-slate-400'
                          } disabled:cursor-not-allowed`}
                        >
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
                            className={`shrink-0 rounded-sm border px-2 py-1 font-mono text-[11px] font-medium ${
                              note
                                ? 'border-[#b8c9db] bg-white text-slate-700'
                                : canEditNote
                                  ? 'border-[#d4deea] bg-white text-slate-600'
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
  )
}
