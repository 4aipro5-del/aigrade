import { supabase } from '../lib/supabaseClient'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.18 7.09-10.36 7.09-17.49z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export function Auth() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      console.error('구글 로그인 실패:', error.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-900">
      <header className="border-b border-[#234a7a] bg-[#2c5d93] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 text-[13px] font-semibold text-blue-100">
              <span>교사용 업무 시스템</span>
              <span className="h-px w-10 bg-blue-200/70" aria-hidden="true" />
            </div>
            <h1 className="mt-2 text-[32px] font-bold leading-tight text-white sm:text-[36px]">
              교과평가 종합의견 작성 시스템
            </h1>
            <div className="mt-3 h-1 w-16 rounded-full bg-blue-200/70" aria-hidden="true" />
          </div>
          <div className="hidden border-l border-white/20 pl-5 text-right text-sm text-blue-100 sm:block">
            <div className="font-medium text-white">학기말 평가 업무 지원</div>
            <div className="mt-1 text-xs">Google 계정 로그인 연동</div>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-8">
        <section className="w-full max-w-4xl rounded-md border border-[#b7c9dd] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(44,93,147,0.08)] lg:px-8 lg:py-8">
          <div className="text-xs font-semibold tracking-wide text-[#2c5d93]">STEP 01</div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">교사 인증 후 시작합니다</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Google 계정으로 로그인하면 현재 학기 데이터를 불러와 바로 작업을 시작할 수 있습니다.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm border border-[#234a7a] bg-[#2c5d93] px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#244f80] focus:outline-none focus:ring-2 focus:ring-[#5e93cf]"
          >
            <GoogleIcon />
            Google 계정으로 로그인
          </button>

          <div className="mt-3 text-xs leading-5 text-slate-500">
            로그인 후 학생 관리, 평가 입력, 종합의견 메뉴를 사용할 수 있습니다.
          </div>

          <div className="mt-6 border-t border-[#d9e3ee] pt-5">
            <div className="font-medium text-slate-800">로그인 후 할 일</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className="border-l-4 border-[#8aa6c8] pl-3">
                <div className="text-xs font-semibold text-[#6f86a6]">01</div>
                <div className="mt-1 font-medium text-slate-800">학생 관리</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">명단 등록과 확인</div>
              </div>
              <div className="border-l-4 border-[#8aa6c8] pl-3">
                <div className="text-xs font-semibold text-[#6f86a6]">02</div>
                <div className="mt-1 font-medium text-slate-800">평가 입력</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">성취수준과 메모 입력</div>
              </div>
              <div className="border-l-4 border-[#8aa6c8] pl-3">
                <div className="text-xs font-semibold text-[#6f86a6]">03</div>
                <div className="mt-1 font-medium text-slate-800">종합의견 검토</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">저장 또는 복사</div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-[#d9e3ee] pt-4 text-xs leading-5 text-slate-500">
            학생 이름은 화면 표시용으로 로컬에 우선 저장되며 서버 식별값과 분리됩니다.
          </div>
        </section>
      </main>
    </div>
  )
}
