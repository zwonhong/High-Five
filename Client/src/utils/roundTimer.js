/** 서버 roundEndsAt(ms) 기준 남은 초 */
export function calcTimeLeftFromEndsAt(roundEndsAt) {
  if (!roundEndsAt) return 0
  return Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000))
}

/** round_start / reconnect_success payload → 스토어 동기화 */
export function applyRoundTimerPayload(data, setRoundEndsAt, setTimeLeft) {
  if (data?.roundEndsAt) {
    setRoundEndsAt(data.roundEndsAt)
    setTimeLeft(calcTimeLeftFromEndsAt(data.roundEndsAt))
    return
  }
  if (typeof data?.timeLeft === 'number') {
    setTimeLeft(data.timeLeft)
  }
}
