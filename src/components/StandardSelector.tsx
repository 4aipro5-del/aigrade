import { useMemo } from 'react'
import type { AchievementStandard } from '../types/database'

interface StandardSelectorProps {
  standards: AchievementStandard[]
  selectedCodes: string[]
  onToggleCode: (code: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  onSelectDomain: (codes: string[]) => void
  onClearDomain: (codes: string[]) => void
}

export function StandardSelector({
  standards,
  selectedCodes,
  onToggleCode,
  onSelectAll,
  onClearAll,
  onSelectDomain,
  onClearDomain,
}: StandardSelectorProps) {
  const groups = useMemo(() => {
    const grouped = new Map<string, AchievementStandard[]>()
    for (const standard of standards) {
      const key = standard.domain || '기타'
      grouped.set(key, [...(grouped.get(key) ?? []), standard])
    }
    return Array.from(grouped.entries())
  }, [standards])

  if (standards.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        선택 가능한 성취기준이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8e3ef] bg-white p-4 shadow-[0_10px_24px_rgba(140,164,188,0.08)]">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            평가에 사용할 성취기준을 먼저 선택합니다.
          </div>
          <div className="mt-1 text-xs text-slate-500">
            체크한 기준만 평가 입력과 종합의견 화면에 표시됩니다.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-[#dce8ef] bg-[#f4fbfd] px-3 py-1.5 text-xs font-medium text-slate-600">
            선택 {selectedCodes.length} / {standards.length}
          </div>
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded-full border border-[#d7e1ec] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-[#f5f9fc]"
          >
            전체 선택
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full border border-[#e5e9ef] bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-[#f8fafc]"
          >
            전체 해제
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(([domain, items]) => {
          const selectedInDomain = items.filter((item) => selectedCodes.includes(item.code)).length
          return (
            <section
              key={domain}
              className="rounded-2xl border border-[#d8e3ef] bg-white shadow-[0_10px_24px_rgba(140,164,188,0.08)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#e7eef6] bg-[#f8fbff] px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{domain}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {selectedInDomain} / {items.length} 선택
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectDomain(items.map((item) => item.code))}
                    className="rounded-full border border-[#d9e2ed] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-[#f5f9fc]"
                  >
                    영역 전체 선택
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearDomain(items.map((item) => item.code))}
                    className="rounded-full border border-[#e5e9ef] bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-[#f8fafc]"
                  >
                    영역 전체 해제
                  </button>
                </div>
              </div>
              <div className="divide-y divide-[#eef3f8]">
                {items.map((standard) => {
                  const checked = selectedCodes.includes(standard.code)
                  return (
                    <label
                      key={standard.code}
                      className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-[#fbfdff]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleCode(standard.code)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2c5d93] focus:ring-[#9fc1e8]"
                      />
                      <div className="min-w-0">
                        <div className="font-mono text-[12px] font-semibold text-[#7d92b1]">
                          {standard.code}
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-700">
                          {standard.description}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{standard.grade}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
