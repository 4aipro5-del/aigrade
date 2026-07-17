import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'
import { useAssessmentGrid } from './hooks/useAssessmentGrid'
import { AssessmentGrid } from './components/AssessmentGrid'
import { StudentManager } from './components/StudentManager'
import { ReportCommentPanel } from './components/ReportCommentPanel'
import { Auth } from './components/Auth'

const SUBJECTS = ['국어', '수학', '사회', '과학', '영어', '도덕', '실과', '체육', '음악', '미술']

type Tab = 'assessment' | 'report' | 'students'

const TAB_META: Record<Tab, { label: string; section: string; description: string }> = {
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
  students: {
    label: '학생 관리',
    section: '기초자료관리',
    description: '학급 학생 명단을 등록하고 확인합니다.',
  },
}

function Dashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('assessment')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [term, setTerm] = useState('2026-1학기')

  const { students, standards, getLevel, getNote, setLevel, setNote, loading, error } =
    useAssessmentGrid(subject, term)

  const showSubjectPicker = tab === 'assessment' || tab === 'report'
  const currentTabMeta = TAB_META[tab]

  return (
    <div className="min-h-screen bg-[#eef3f8]">
      <header className="border-b border-[#234a7a] bg-[#2c5d93] text-white">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs text-blue-100">교육행정업무 지원 시스템</div>
            <h1 className="text-lg font-semibold">학기말 교과평가 종합의견 자동 생성기</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-100 sm:text-sm">
            <span className="hidden sm:inline">{session.user.email}</span>
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
          <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
            <div>
              <div className="text-xs text-slate-500">업무영역 &gt; {currentTabMeta.section}</div>
              <div className="mt-1 text-lg font-semibold text-slate-800">{currentTabMeta.label}</div>
              <div className="mt-1 text-sm text-slate-500">{currentTabMeta.description}</div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-sm border border-[#ccd8e6] bg-[#f7fafe] px-3 py-2">
                <div className="text-xs text-slate-500">학생 수</div>
                <div className="mt-1 font-semibold text-slate-800">{students.length}명</div>
              </div>
              <div className="rounded-sm border border-[#ccd8e6] bg-[#f7fafe] px-3 py-2">
                <div className="text-xs text-slate-500">성취기준 수</div>
                <div className="mt-1 font-semibold text-slate-800">{standards.length}개</div>
              </div>
              <div className="rounded-sm border border-[#ccd8e6] bg-[#f7fafe] px-3 py-2">
                <div className="text-xs text-slate-500">현재 학기</div>
                <div className="mt-1 font-semibold text-slate-800">{term}</div>
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {(Object.keys(TAB_META) as Tab[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-w-[132px] rounded-sm border px-3 py-2 text-left text-sm ${
                  tab === key
                    ? 'border-[#234a7a] bg-[#2c5d93] text-white'
                    : 'border-[#bccbdb] bg-[#f8fafc] text-slate-700 hover:bg-[#eef4fa]'
                }`}
              >
                <div className="text-[11px] opacity-80">{TAB_META[key].section}</div>
                <div className="font-medium">{TAB_META[key].label}</div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-b border-[#c8d5e3] bg-[#f3f7fb]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-3">
          <div className="rounded-sm border border-[#b7c9dd] bg-white">
            <div className="border-b border-[#d4e0ec] bg-[#edf4fb] px-4 py-2 text-sm font-medium text-[#1f3d63]">
              기본 조회 조건
            </div>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <span className="min-w-10 font-medium">학기</span>
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="h-9 w-36 rounded-sm border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e97c6]"
                />
              </label>
              {showSubjectPicker && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="min-w-10 font-medium">교과</span>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-9 w-28 rounded-sm border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e97c6]"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="text-xs text-slate-500">
                현재 화면에 필요한 조회 조건을 변경하면 데이터가 즉시 다시 반영됩니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-4">
        {tab === 'students' && <StudentManager />}

        {(tab === 'assessment' || tab === 'report') && error && (
          <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {tab === 'assessment' &&
          (loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              불러오는 중...
            </div>
          ) : (
            <AssessmentGrid
              students={students}
              standards={standards}
              getLevel={getLevel}
              getNote={getNote}
              onChangeLevel={setLevel}
              onChangeNote={setNote}
            />
          ))}

        {tab === 'report' &&
          (loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              불러오는 중...
            </div>
          ) : (
            <ReportCommentPanel
              students={students}
              standards={standards}
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
