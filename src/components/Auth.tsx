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
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs text-blue-100">교육행정업무 지원 시스템</div>
            <h1 className="text-lg font-semibold">학기말 교과평가 종합의견 자동 생성기</h1>
          </div>
          <div className="hidden text-right text-xs text-blue-100 sm:block">
            <div>교사용 업무 화면</div>
            <div>Google 계정 로그인 연동</div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <div className="rounded-md border border-[#b7c9dd] bg-white">
          <div className="border-b border-[#b7c9dd] bg-[#f3f7fb] px-4 py-2 text-sm font-medium text-[#1f3d63]">
            사용자 로그인
          </div>

          <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-sm border border-slate-300">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <th className="w-36 bg-[#f7f7f7] px-3 py-3 text-left font-medium text-slate-700">
                        시스템 안내
                      </th>
                      <td className="px-3 py-3 leading-6 text-slate-700">
                        학생 목록 등록, 성취수준 입력, 종합의견 생성 및 저장 업무를 한
                        화면에서 처리할 수 있습니다.
                      </td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <th className="bg-[#f7f7f7] px-3 py-3 text-left font-medium text-slate-700">
                        주요 기능
                      </th>
                      <td className="px-3 py-3 text-slate-700">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-sm border border-[#d8e2ee] bg-[#fbfcfe] px-3 py-2">
                            학생 관리
                          </div>
                          <div className="rounded-sm border border-[#d8e2ee] bg-[#fbfcfe] px-3 py-2">
                            평가 입력
                          </div>
                          <div className="rounded-sm border border-[#d8e2ee] bg-[#fbfcfe] px-3 py-2">
                            종합의견 검토
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-[#f7f7f7] px-3 py-3 text-left font-medium text-slate-700">
                        사용 안내
                      </th>
                      <td className="px-3 py-3 leading-6 text-slate-700">
                        최초 접속 후 학생 명단 파일을 등록하고, 교과 및 학기를 선택한 뒤
                        성취수준과 메모를 입력해 종합의견을 확인해 주세요.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-sm border border-[#d6c79b] bg-[#fffbea]">
                <div className="border-b border-[#e6d8ab] bg-[#fff2c8] px-3 py-2 text-sm font-medium text-[#6f5613]">
                  공지사항
                </div>
                <ul className="space-y-2 px-4 py-3 text-sm leading-6 text-slate-700">
                  <li>학생 이름은 화면 표시용으로 로컬에 우선 저장되며 서버 식별값과 분리됩니다.</li>
                  <li>종합의견 저장 전 바이트 길이를 확인해 학교 기록 시스템 기준에 맞춰 주세요.</li>
                </ul>
              </div>
            </section>

            <aside className="order-1 lg:order-2">
              <div className="rounded-sm border border-[#b7c9dd] bg-[#fbfdff]">
                <div className="border-b border-[#b7c9dd] bg-[#edf4fb] px-4 py-2 text-sm font-medium text-[#1f3d63]">
                  교사 인증
                </div>
                <div className="p-4">
                  <div className="rounded-sm border border-slate-300 bg-white p-4">
                    <div className="text-sm font-medium text-slate-800">로그인 방법</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Google 계정으로 로그인 후 현재 학기 평가 데이터를 조회하고 업무를
                      이어서 처리합니다.
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm border border-[#234a7a] bg-[#2c5d93] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#244f80] focus:outline-none focus:ring-2 focus:ring-[#5e93cf]"
                    >
                      <GoogleIcon />
                      Google 계정으로 로그인
                    </button>
                  </div>

                  <div className="mt-4 rounded-sm border border-slate-300 bg-white p-4 text-sm text-slate-700">
                    <div className="font-medium text-slate-800">접속 후 가능 업무</div>
                    <ul className="mt-2 space-y-2 leading-6">
                      <li>1. 학급 학생 파일 등록 및 열 매핑</li>
                      <li>2. 성취기준별 성취수준 및 메모 입력</li>
                      <li>3. 학생별 종합의견 복사, 임시저장, 확정</li>
                    </ul>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
