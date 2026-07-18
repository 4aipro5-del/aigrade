import { useMemo, useState } from 'react'
import type { AchievementLevel, AchievementStandard, Student } from '../types/database'
import { useAchievementTemplates } from '../hooks/useAchievementTemplates'
import { useAssessments } from '../hooks/useAssessments'
import { buildTemplateLookup, generateReportComment } from '../lib/reportComment'
import { calculateByteLength } from '../lib/byteLength'
import { getDisplayName } from '../lib/studentNames'

interface ReportCommentPanelProps {
  students: Student[]
  standards: AchievementStandard[]
  subject: string
  term: string
  getLevel: (studentId: string, standardCode: string) => AchievementLevel | undefined
  getNote: (studentId: string, standardCode: string) => string | undefined
}

const STATUS_LABEL: Record<'draft' | 'final', string> = {
  draft: '저장됨',
  final: '저장됨',
}

const STATUS_STYLE: Record<'draft' | 'final', string> = {
  draft: 'bg-amber-50 text-amber-700',
  final: 'bg-emerald-50 text-emerald-700',
}

export function ReportCommentPanel({
  students,
  standards,
  subject,
  term,
  getLevel,
  getNote,
}: ReportCommentPanelProps) {
  const [byteLimit, setByteLimit] = useState(1500)
  const [bytesPerKorean, setBytesPerKorean] = useState(3)
  const [savingAll, setSavingAll] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const standardCodes = useMemo(() => standards.map((s) => s.code), [standards])
  const { templates, loading, error } = useAchievementTemplates(standardCodes)
  const templateLookup = useMemo(() => buildTemplateLookup(templates), [templates])

  const studentIds = useMemo(() => students.map((s) => s.id), [students])
  const { records, saveAssessment } = useAssessments(studentIds, subject, term)

  const comments = useMemo(
    () =>
      students.map((student) => ({
        student,
        text: generateReportComment({
          studentId: student.id,
          standards,
          getLevel,
          getNote,
          templateLookup,
        }),
      })),
    [students, standards, getLevel, getNote, templateLookup],
  )

  const saveTargets = useMemo(
    () =>
      comments.filter(({ student, text }) => {
        if (!text) return false
        const record = records[student.id]
        return !record || record.generatedComment !== text || record.status !== 'draft'
      }),
    [comments, records],
  )

  const handleSaveAll = async () => {
    if (saveTargets.length === 0) return

    setSavingAll(true)
    setSaveError(null)

    for (const { student, text } of saveTargets) {
      const err = await saveAssessment(student.id, text, 'draft')
      if (err) {
        setSaveError(err)
        setSavingAll(false)
        return
      }
    }

    setSavingAll(false)
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        템플릿을 불러오는 중...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        학생 또는 성취기준이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8e3ef] bg-white p-4 shadow-[0_10px_24px_rgba(140,164,188,0.08)]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <label className="flex items-center gap-2 rounded-full border border-[#e7e1f7] bg-[#faf7ff] px-3 py-2">
            바이트 제한
            <input
              type="number"
              value={byteLimit}
              onChange={(e) => setByteLimit(Number(e.target.value))}
              className="w-20 rounded-full border border-[#d9d0ef] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#d8caf7]"
            />
          </label>
          <label className="flex items-center gap-2 rounded-full border border-[#dce8ef] bg-[#f4fbfd] px-3 py-2">
            한글 1자당 바이트
            <input
              type="number"
              value={bytesPerKorean}
              onChange={(e) => setBytesPerKorean(Number(e.target.value))}
              className="w-16 rounded-full border border-[#d0e0e8] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5dfe9]"
            />
          </label>
          <span className="text-xs text-slate-400">
            시스템마다 기준이 달라 예시값입니다. 실제 사용 중인 입력 시스템 기준으로 조정하세요.
          </span>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saveTargets.length === 0 || savingAll}
          className="rounded-full bg-[#2c5d93] px-4 py-2 text-sm font-medium text-white hover:bg-[#244f80] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {savingAll ? '저장 중...' : '저장'}
        </button>
      </div>

      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#d8e3ef] bg-white shadow-[0_10px_24px_rgba(140,164,188,0.08)]">
        <div className="hidden grid-cols-[140px_minmax(0,1fr)_180px] border-b border-[#e6edf5] bg-[#f8fbff] px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 lg:grid">
          <div>학생</div>
          <div>종합의견</div>
          <div className="text-right">상태</div>
        </div>
        {comments.map(({ student, text }) => {
          const byteLen = calculateByteLength(text, { nonAsciiBytes: bytesPerKorean })
          const over = byteLen > byteLimit
          const record = records[student.id]
          const isStale = record && record.generatedComment !== text
          return (
            <div
              key={student.id}
              className="grid gap-3 border-b border-[#eef3f8] px-4 py-3 last:border-b-0 lg:grid-cols-[140px_minmax(0,1fr)_180px] lg:items-center"
            >
              <div className="pt-1">
                <div className="text-base font-semibold text-slate-800 lg:text-[15px]">
                  {getDisplayName(student.id, student.pseudo_label)}
                </div>
              </div>

              <div className="min-w-0">
                <div className="rounded-xl border border-[#edf2f7] bg-[#fbfdff] px-4 py-2 text-[14px] leading-6 text-slate-700">
                  {text ? (
                    <p className="whitespace-pre-wrap break-words">{text}</p>
                  ) : (
                    <p className="text-slate-400">입력된 성취수준이 없습니다.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 lg:justify-end">
                <div className="flex min-w-0 items-center gap-2">
                  {record && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[record.status]}`}
                      title={isStale ? '성취수준/메모가 저장 시점 이후 변경됨' : undefined}
                    >
                      {STATUS_LABEL[record.status]}
                      {isStale ? ' · 변경됨' : ''}
                    </span>
                  )}
                  <div
                    className={`whitespace-nowrap text-xs ${over ? 'font-medium text-red-600' : 'text-slate-400'}`}
                  >
                    {byteLen} / {byteLimit} bytes{over && ' 초과'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
