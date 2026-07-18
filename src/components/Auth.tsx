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
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <main className="flex min-h-screen items-center justify-center px-6 py-14 lg:px-10">
        <section className="w-full max-w-5xl overflow-hidden rounded-[22px] border border-[#d2dbe8] bg-white shadow-[0_20px_48px_rgba(81,105,140,0.12)]">
          <div className="bg-[#2f6fdc] px-6 py-6 text-white lg:px-8 lg:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
              <div className="hidden border-l border-white/20 pl-5 text-right text-sm text-[#dbe7ff] sm:block">
                <div className="font-medium text-white">학기말 평가 업무 지원</div>
                <div className="mt-1 text-xs">Google 계정 로그인 연동</div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
            <div className="border-b border-[#e3ebf4] px-7 py-8 lg:border-b-0 lg:border-r lg:px-9 lg:py-9">
              <div className="text-xs font-semibold tracking-wide text-[#2f6fdc]">STEP 01</div>
              <h2 className="mt-2 text-[28px] font-bold leading-tight text-[#1f2f46]">
                교사 인증 후 시작합니다
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f7188]">
                Google 계정으로 로그인하면 현재 학기 데이터를 불러와 바로 작업을 시작할 수 있습니다.
              </p>

              <div className="mt-8 border-t border-[#e4ecf6] pt-6">
                <div className="font-semibold text-[#334863]">로그인 후 할 일</div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="border-l-[3px] border-[#8fb0e3] pl-3">
                    <div className="text-xs font-semibold text-[#6f86a6]">01</div>
                    <div className="mt-1 font-medium text-slate-800">학생 관리</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">명단 등록과 확인</div>
                  </div>
                  <div className="border-l-[3px] border-[#8fb0e3] pl-3">
                    <div className="text-xs font-semibold text-[#6f86a6]">02</div>
                    <div className="mt-1 font-medium text-slate-800">평가 입력</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">성취수준과 메모 입력</div>
                  </div>
                  <div className="border-l-[3px] border-[#8fb0e3] pl-3">
                    <div className="text-xs font-semibold text-[#6f86a6]">03</div>
                    <div className="mt-1 font-medium text-slate-800">종합의견 검토</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">저장 또는 복사</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-[#e4ecf6] pt-4 text-xs leading-5 text-[#6b7d94]">
                학생 이름은 화면 표시용으로 로컬에 우선 저장되며 서버 식별값과 분리됩니다.
              </div>
            </div>

            <div className="px-7 py-8 lg:px-9 lg:py-9">
              <div className="rounded-2xl border border-[#d7e3f2] bg-[#f8fbff] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="text-sm font-semibold text-[#35557d]">교사 인증</div>
                <p className="mt-3 text-sm leading-6 text-[#5f7188]">
                  로그인 후 학생 관리, 평가 입력, 종합의견 메뉴를 사용할 수 있습니다.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm border border-[#245dbf] bg-[#2f6fdc] px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#285fbc] focus:outline-none focus:ring-2 focus:ring-[#8fb6f5]"
                >
                  <GoogleIcon />
                  Google 계정으로 로그인
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
