import { useEffect } from 'react'
import { socketClient } from '../socket/socketClient'
import { useSocketStore } from '../stores/useSocketStore'
import { useGamePhaseStore, GAME_PHASE } from '../stores/useGamePhaseStore'

// 세션 저장소 키
const SESSION_KEY = 'hf_session'

// 세션 저장 (방 입장 및 게임 시작 시 갱신)
function saveSession(roomId, nickname, socketId, gamePhase) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, nickname, socketId, gamePhase }))
}

// 세션 조회
function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

// 세션 삭제 (재연결 실패 또는 게임 종료 시)
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function useSocketEvents() {
  const nickname = useSocketStore((state) => state.nickname)
  const setNickname = useSocketStore((state) => state.setNickname)
  const setRoomId = useSocketStore((state) => state.setRoomId)
  const setUsers = useSocketStore((state) => state.setUsers)
  const addChatMessage = useSocketStore((state) => state.addChatMessage)
  const setIsConnected = useSocketStore((state) => state.setIsConnected)
  const setHasJoined = useSocketStore((state) => state.setHasJoined)
  const setErrorMessage = useSocketStore((state) => state.setErrorMessage)
  const setIsDrawer = useSocketStore((state) => state.setIsDrawer)
  const setTimeLimit = useSocketStore((state) => state.setTimeLimit)
  const setMaxRound = useSocketStore((state) => state.setMaxRound)

  const goToPlaying = useGamePhaseStore((state) => state.goToPlaying)
  const goToWaiting = useGamePhaseStore((state) => state.goToWaiting)
  const goToStart = useGamePhaseStore((state) => state.goToStart)

  useEffect(() => {

    // 소켓 연결 성공 — 세션이 있으면 재연결 시도
    socketClient.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected:', socketClient.id)

      const session = getSession()
      if (session && session.socketId !== socketClient.id) {
        console.log('이전 세션 감지, 재연결 시도:', session)
        socketClient.emit('try_reconnect', {
          roomId: session.roomId,
          oldSocketId: session.socketId,
          nickname: session.nickname
        })
      }
    })

    // 소켓 연결 해제
    socketClient.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    // 방 인원 변경 (입장/퇴장) — 세션 갱신
    socketClient.on('room_update', (data) => {
      setRoomId(data.roomId)
      setUsers(data.users)
      setHasJoined(true)

      // 재연결용 세션 저장
      const session = getSession()
      saveSession(data.roomId, nickname, socketClient.id, session?.gamePhase ?? GAME_PHASE.WAITING)
    })

    // 채팅 메시지 수신
    socketClient.on('receive_chat', (data) => {
      addChatMessage(data)
    })

    // 게임 시작 (5명 모두 입장 시 서버에서 전송)
    socketClient.on('game_start', (data) => {
      console.log('game_start 수신', data)
      setIsDrawer(data.canDraw ?? false)
      if (data.timeLimit) setTimeLimit(data.timeLimit)
      if (data.maxRound) setMaxRound(data.maxRound)
      goToPlaying()

      // 세션의 gamePhase 갱신
      const session = getSession()
      if (session) saveSession(session.roomId, session.nickname, session.socketId, GAME_PHASE.PLAYING)
    })

    // 재연결 성공 — 세션 복원
    socketClient.on('reconnect_success', (data) => {
      console.log('reconnect_success 수신', data)

      const session = getSession()
      if (!session) return

      setRoomId(data.roomId)
      setUsers(data.users)
      setHasJoined(true)
      setNickname(session.nickname)

      // 이전 게임 단계로 복귀
      if (session.gamePhase === GAME_PHASE.PLAYING) {
        goToPlaying()
      } else {
        goToWaiting()
      }

      // 세션의 socketId 갱신
      saveSession(data.roomId, session.nickname, socketClient.id, session.gamePhase)
    })

    // 재연결 실패 (10초 초과 등) — 세션 삭제 후 시작 화면으로
    socketClient.on('reconnect_fail', (msg) => {
      console.log('reconnect_fail 수신:', msg)
      clearSession()
      setErrorMessage(msg)
      goToStart()
    })

    // 서버 에러 메시지 (닉네임 중복, 방 만석 등)
    socketClient.on('error_message', (msg) => {
      console.log('error_message 수신:', msg)
      setErrorMessage(msg)
    })

    return () => {
      socketClient.off('connect')
      socketClient.off('disconnect')
      socketClient.off('room_update')
      socketClient.off('receive_chat')
      socketClient.off('game_start')
      socketClient.off('reconnect_success')
      socketClient.off('reconnect_fail')
      socketClient.off('error_message')
    }
  }, [nickname, setNickname, setRoomId, setUsers, addChatMessage, setIsConnected, setHasJoined, setErrorMessage, setIsDrawer, setTimeLimit, setMaxRound, goToPlaying, goToWaiting, goToStart])
}
