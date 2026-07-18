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
    <div className="min-h-screen bg-[#eef3f8]">
      <header className="border-b border-[#234a7a] bg-[#2c5d93] text-white">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 text-[13px] font-semibold text-blue-100">
              <span>교사용 업무 시스템</span>
              <span className="h-px w-10 bg-blue-200/70" aria-hidden="true" />
            </div>
            <h1 className="mt-2 text-[30px] font-bold leading-tight text-white sm:text-[34px]">
              교과평가 종합의견 작성 시스템
            </h1>
            <div className="mt-3 h-1 w-16 rounded-full bg-blue-200/70" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="hidden text-right text-sm text-blue-100 sm:block">
              <div className="font-medium text-white">교사용 업무 화면</div>
              <div className="mt-1 text-xs">{session.user.email}</div>
            </div>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-sm border border-white/40 bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[#b7c9dd] bg-white">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-3">
          <div>
            <div className="text-xs text-slate-500">업무영역 &gt; {currentTabMeta.section}</div>
            <div className="mt-1 text-lg font-semibold text-slate-800">{currentTabMeta.label}</div>
            <div className="mt-1 text-sm text-slate-500">{currentTabMeta.description}</div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {TAB_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-w-[132px] rounded-xl border px-3 py-2 text-left text-sm transition ${
                  tab === key
                    ? 'border-[#2c5d93] bg-[#2c5d93] text-white shadow-sm shadow-[#2c5d93]/20'
                    : 'border-[#d5e0ed] bg-white text-slate-700 hover:bg-[#f4f8fc]'
                }`}
              >
                <div className="text-[11px] opacity-80">{TAB_META[key].section}</div>
                <div className="font-medium">{TAB_META[key].label}</div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {showCommonFilter && (
        <div className="border-b border-[#c8d5e3] bg-[#f3f7fb]">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-3">
            <div className="rounded-2xl border border-[#d7e2ee] bg-white shadow-[0_8px_24px_rgba(131,155,181,0.08)]">
              <div className="border-b border-[#e3ebf4] bg-[#f7fbff] px-5 py-3 text-sm font-semibold text-[#35557d]">
                기본 조회 조건
              </div>
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <label className="flex items-center gap-2 rounded-full border border-[#dde7f1] bg-[#f8fbff] px-3 py-2 text-sm text-slate-700 shadow-sm shadow-[#e8f0f8]/70">
                  <span className="min-w-12 font-medium text-slate-500">학년도</span>
                  <input
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="h-9 w-24 rounded-full border border-[#d1ddeb] bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-[#b7d3f0]"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-full border border-[#dde7f1] bg-[#eef8f4] px-3 py-2 text-sm text-slate-700 shadow-sm shadow-[#e3f1ea]/70">
                  <span className="min-w-10 font-medium text-slate-500">학기</span>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="h-9 min-w-[112px] rounded-full border border-[#d1e6da] bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-[#bfe6d0]"
                  >
                    <option value="1학기">1학기</option>
                    <option value="2학기">2학기</option>
                  </select>
                </label>
                {showGradePicker && (
                  <label className="flex items-center gap-2 rounded-full border border-[#dde7f1] bg-[#f1f8ee] px-3 py-2 text-sm text-slate-700 shadow-sm shadow-[#e7f2e2]/70">
                    <span className="min-w-10 font-medium text-slate-500">학년</span>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="h-9 min-w-[148px] rounded-full border border-[#d1e6da] bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-[#bfe6d0]"
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
                    <label className="flex items-center gap-2 rounded-full border border-[#dde7f1] bg-[#f7f3ff] px-3 py-2 text-sm text-slate-700 shadow-sm shadow-[#ece7fb]/70">
                      <span className="min-w-10 font-medium text-slate-500">교과</span>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-9 min-w-[132px] rounded-full border border-[#d9d7ef] bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-[#d3c7f7]"
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
                <div className="text-xs text-slate-500">
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
