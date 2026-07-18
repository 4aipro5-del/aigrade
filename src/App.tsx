import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'
import { getGradeGroupForGrade } from './lib/gradeGroup'
import { useAssessmentGrid } from './hooks/useAssessmentGrid'
import { useStandardSelection } from './hooks/useStandardSelection'
import { useSubjects } from './hooks/useSubjects'
import { AssessmentGrid } from './components/AssessmentGrid'
import { StandardSelector } from './components/StandardSelector'
import { StudentManager } from './components/StudentManager'
import { ReportCommentPanel } from './components/ReportCommentPanel'
import { Auth } from './components/Auth'

type Tab = 'students' | 'standards' | 'assessment' | 'report'

const TAB_ORDER: Tab[] = ['students', 'standards', 'assessment', 'report']

const TAB_META: Record<Tab, { label: string; section: string; description: string }> = {
  students: {
    label: '학생 관리',
    section: '기초자료관리',
    description: '학급 학생 명단을 등록하고 확인합니다.',
  },
  standards: {
    label: '성취기준',
    section: '기준설정',
    description: '이번 평가에 사용할 성취기준만 선택해 둡니다.',
  },
  assessment: {
    label: '평가 입력',
    section: '평가관리',
    description: '학생별 성취수준과 메모를 입력합니다.',
  },
  report: {
    label: '종합의견',
    section: '기록관리',
    description: '생성된 종합의견을 검토하고 저장합니다.',
  },
}

function Dashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('students')
  const [subject, setSubject] = useState('')
  const [schoolYear, setSchoolYear] = useState('2026')
  const [semester, setSemester] = useState('1학기')
  const [grade, setGrade] = useState('6')
  const term = `${schoolYear}-${semester}`
  const gradeNumber = Number(grade)
  const gradeGroup = getGradeGroupForGrade(gradeNumber)

  const { subjects } = useSubjects(gradeGroup)

  useEffect(() => {
    if (subjects.length === 0) {
      setSubject('')
      return
    }

    if (!subject || !subjects.includes(subject)) {
      setSubject(subjects[0])
    }
  }, [subjects, subject])

  const { students, standards, getLevel, getNote, setLevel, setNote, loading, error } =
    useAssessmentGrid(subject, term, gradeNumber)
  const {
    selectedCodes,
    selectedCount,
    toggleCode,
    selectAll,
    clearAll,
    setSelectedCodes,
  } = useStandardSelection(standards, session.user.id, subject, term, gradeNumber)

  const activeStandards = standards.filter((standard) => selectedCodes.includes(standard.code))
  const showGradePicker = true
  const showSubjectPicker = tab === 'standards' || tab === 'assessment' || tab === 'report'
  const showCommonFilter = tab !== 'students'
  const currentTabMeta = TAB_META[tab]

  return (
    <div className="min-h-screen bg-[#f1f4f9]">
      <header className="border-b border-[#2159bc] bg-[#2f6fdc] text-white">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 text-[13px] font-semibold text-[#dbe7ff]">
              <span>교사용 업무 시스템</span>
              <span className="h-px w-10 bg-[#bcd2ff]" aria-hidden="true" />
            </div>
            <h1 className="mt-2 text-[30px] font-bold leading-tight text-white sm:text-[34px]">
              교과평가 종합의견 작성 시스템
            </h1>
            <div className="mt-3 h-1 w-16 rounded-full bg-[#bcd2ff]" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="hidden text-right text-sm text-[#dbe7ff] sm:block">
              <div className="font-medium text-white">교사용 업무 화면</div>
              <div className="mt-1 text-xs">{session.user.email}</div>
            </div>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-sm border border-[#bdd1fa] bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/18"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[#c7d4e7] bg-white">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-3">
          <div>
            <div className="mt-1 text-lg font-semibold text-[#263b5e]">{currentTabMeta.label}</div>
            <div className="mt-1 text-sm text-[#667892]">{currentTabMeta.description}</div>
          </div>

          <nav className="overflow-x-auto border-b border-[#d9e3f1]" aria-label="업무 탭">
            <div className="flex min-w-max items-end gap-5 px-1">
              {TAB_ORDER.map((key) => {
                const isActive = tab === key

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`border-b-[3px] px-1 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-[#2f6fdc] text-[#2f6fdc]'
                        : 'border-transparent text-[#6c7d94] hover:text-[#3f6fb6]'
                    }`}
                  >
                    {TAB_META[key].label}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      {showCommonFilter && (
        <div className="border-b border-[#d6e0ee] bg-[#edf2f8]">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-3">
            <div className="rounded-2xl border border-[#d4dfed] bg-white shadow-[0_8px_22px_rgba(112,138,173,0.08)]">
              <div className="border-b border-[#e2eaf5] bg-[#f7faff] px-5 py-3 text-sm font-semibold text-[#3460a8]">
                기본 조회 조건
              </div>
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <label className="flex items-center gap-2 rounded-full border border-[#d9e3ef] bg-[#f6f9fd] px-3 py-2 text-sm text-[#42556f] shadow-sm shadow-[#edf3fa]">
                  <span className="min-w-12 font-medium text-[#62758e]">학년도</span>
                  <input
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="h-9 w-24 rounded-full border border-[#ccd9ea] bg-white px-3 text-sm text-[#30445f] outline-none transition focus:border-[#82acef] focus:ring-2 focus:ring-[#cfe0fb]"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-full border border-[#d9e3ef] bg-[#f6f9fd] px-3 py-2 text-sm text-[#42556f] shadow-sm shadow-[#edf3fa]">
                  <span className="min-w-10 font-medium text-[#62758e]">학기</span>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="h-9 min-w-[112px] rounded-full border border-[#ccd9ea] bg-white px-3 text-sm text-[#30445f] outline-none transition focus:border-[#82acef] focus:ring-2 focus:ring-[#cfe0fb]"
                  >
                    <option value="1학기">1학기</option>
                    <option value="2학기">2학기</option>
                  </select>
                </label>
                {showGradePicker && (
                  <label className="flex items-center gap-2 rounded-full border border-[#d9e3ef] bg-[#f6f9fd] px-3 py-2 text-sm text-[#42556f] shadow-sm shadow-[#edf3fa]">
                    <span className="min-w-10 font-medium text-[#62758e]">학년</span>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="h-9 min-w-[148px] rounded-full border border-[#ccd9ea] bg-white px-3 text-sm text-[#30445f] outline-none transition focus:border-[#82acef] focus:ring-2 focus:ring-[#cfe0fb]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((value) => (
                        <option key={value} value={value}>
                          {value}학년
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {showSubjectPicker &&
                  (subjects.length > 0 ? (
                    <label className="flex items-center gap-2 rounded-full border border-[#d9e3ef] bg-[#f6f9fd] px-3 py-2 text-sm text-[#42556f] shadow-sm shadow-[#edf3fa]">
                      <span className="min-w-10 font-medium text-[#62758e]">교과</span>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-9 min-w-[132px] rounded-full border border-[#ccd9ea] bg-white px-3 text-sm text-[#30445f] outline-none transition focus:border-[#82acef] focus:ring-2 focus:ring-[#cfe0fb]"
                      >
                        {subjects.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className="text-xs text-amber-700">
                      achievement_standards 테이블에 등록된 교과가 없습니다.
                    </span>
                  ))}
                <div className="text-xs text-[#6b7d94]">
                  학생 관리와 평가 화면 모두 이 조회 조건을 함께 사용합니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1400px] px-4 py-4">
        {tab === 'students' && (
          <StudentManager schoolYear={schoolYear} semester={semester} selectedGrade={gradeNumber} />
        )}

        {(tab === 'standards' || tab === 'assessment' || tab === 'report') && error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {tab === 'standards' &&
          (loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              불러오는 중...
            </div>
          ) : (
            <StandardSelector
              standards={standards}
              selectedCodes={selectedCodes}
              onToggleCode={toggleCode}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              onSelectDomain={(codes) => setSelectedCodes([...selectedCodes, ...codes])}
              onClearDomain={(codes) =>
                setSelectedCodes(selectedCodes.filter((code) => !codes.includes(code)))
              }
            />
          ))}

        {tab === 'assessment' &&
          (loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              불러오는 중...
            </div>
          ) : selectedCount === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-800 shadow-sm">
              성취기준 탭에서 이번 평가에 사용할 성취기준을 먼저 선택해 주세요.
            </div>
          ) : (
            <AssessmentGrid
              students={students}
              standards={activeStandards}
              getLevel={getLevel}
              getNote={getNote}
              onChangeLevel={setLevel}
              onChangeNote={setNote}
            />
          ))}

        {tab === 'report' &&
          (loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              불러오는 중...
            </div>
          ) : selectedCount === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-800 shadow-sm">
              성취기준 탭에서 사용할 성취기준을 먼저 선택하면 종합의견을 볼 수 있습니다.
            </div>
          ) : (
            <ReportCommentPanel
              students={students}
              standards={activeStandards}
              subject={subject}
              term={term}
              getLevel={getLevel}
              getNote={getNote}
            />
          ))}
      </main>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-amber-700">연결 설정 필요</div>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">
            Supabase 연결 정보가 아직 없습니다.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            `.env.example`을 참고해 `.env` 파일에 `VITE_SUPABASE_URL`과
            `VITE_SUPABASE_ANON_KEY`를 설정해 주세요.
          </p>
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            설정이 완료되면 로그인 화면과 교사용 작업 대시보드가 정상적으로 열립니다.
          </div>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-slate-900/10" />
          <div className="mt-4 text-sm font-medium text-slate-700">로그인 상태를 확인하는 중입니다.</div>
          <div className="mt-2 text-sm text-slate-500">잠시만 기다려 주세요.</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return <Dashboard session={session} />
}

export default App
