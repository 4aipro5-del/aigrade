export interface ByteLengthOptions {
  asciiBytes?: number
  nonAsciiBytes?: number
}

// 나이스 등 입력 시스템은 보통 바이트 단위로 글자 수 제한을 두며, 시스템마다
// 한글 1자를 몇 바이트로 세는지가 다르므로(관용적으로 2~3바이트) 설정 가능하게 둔다.
export function calculateByteLength(text: string, options: ByteLengthOptions = {}): number {
  const { asciiBytes = 1, nonAsciiBytes = 3 } = options
  let total = 0
  for (const ch of text) {
    const codePoint = ch.codePointAt(0) ?? 0
    total += codePoint > 127 ? nonAsciiBytes : asciiBytes
  }
  return total
}
