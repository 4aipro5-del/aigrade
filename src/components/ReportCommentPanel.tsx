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
  draft: '임시저장됨',
  final: '확정됨',
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
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

  const copyOne = async (studentId: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(studentId)
    setTimeout(() => setCopiedId((prev) => (prev === studentId ? null : prev)), 1500)
  }

  const copyAll = async () => {
    const combined = comments
      .map(({ student, text }) => `${getDisplayName(student.id, student.pseudo_label)}\n${text}`)
      .join('\n\n')
    await navigator.clipboard.writeText(combined)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  const handleSave = async (studentId: string, text: string, status: 'draft' | 'final') => {
    setSavingId(studentId)
    setSaveError(null)
    const err = await saveAssessment(studentId, text, status)
    setSavingId(null)
    if (err) setSaveError(err)
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            바이트 제한
            <input
              type="number"
              value={byteLimit}
              onChange={(e) => setByteLimit(Number(e.target.value))}
              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
          <label className="flex items-center gap-2">
            한글 1자당 바이트
            <input
              type="number"
              value={bytesPerKorean}
              onChange={(e) => setBytesPerKorean(Number(e.target.value))}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
          <span className="text-xs text-slate-400">
            시스템마다 기준이 달라 예시값입니다. 실제 사용 중인 입력 시스템 기준으로 조정하세요.
          </span>
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {copiedAll ? '복사됨!' : '학급 전체 복사'}
        </button>
      </div>

      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {comments.map(({ student, text }) => {
          const byteLen = calculateByteLength(text, { nonAsciiBytes: bytesPerKorean })
          const over = byteLen > byteLimit
          const record = records[student.id]
          const saving = savingId === student.id
          const isStale = record && record.generatedComment !== text
          return (
            <div key={student.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800">
                  {getDisplayName(student.id, student.pseudo_label)}
                </span>
                <div className="flex items-center gap-2">
                  {record && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[record.status]}`}
                      title={isStale ? '성취수준/메모가 저장 시점 이후 변경됨' : undefined}
                    >
                      {STATUS_LABEL[record.status]}
                      {isStale ? ' · 변경됨' : ''}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => copyOne(student.id, text)}
                    disabled={!text}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedId === student.id ? '복사됨!' : '복사'}
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {text || '입력된 성취수준이 없습니다.'}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className={`text-xs ${over ? 'font-medium text-red-600' : 'text-slate-400'}`}>
                  {byteLen} / {byteLimit} bytes{over && ' — 글자 수 초과'}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(student.id, text, 'draft')}
                    disabled={!text || saving}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    임시저장
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(student.id, text, 'final')}
                    disabled={!text || saving}
                    className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    확정
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
