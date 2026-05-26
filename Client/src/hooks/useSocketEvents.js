import { useEffect } from 'react'
import { socketClient } from '../socket/socketClient'
import { useSocketStore } from '../stores/useSocketStore'
import { useGamePhaseStore, GAME_PHASE } from '../stores/useGamePhaseStore'
import { applyRoundTimerPayload } from '../utils/roundTimer'

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
  const setDrawer = useSocketStore((state) => state.setDrawer)
  const setTopic = useSocketStore((state) => state.setTopic)
  const setCurrentRound = useSocketStore((state) => state.setCurrentRound)
  const setTotalRounds = useSocketStore((state) => state.setTotalRounds)
  const setTimeLeft = useSocketStore((state) => state.setTimeLeft)
  const setRoundEndsAt = useSocketStore((state) => state.setRoundEndsAt)
  const setScores = useSocketStore((state) => state.setScores)
  const setGamePlayers = useSocketStore((state) => state.setGamePlayers)
  const setGameEndData = useSocketStore((state) => state.setGameEndData)
  const setCorrectAnswerInfo = useSocketStore((state) => state.setCorrectAnswerInfo)
  const setChatList = useSocketStore((state) => state.setChatList)
  const setPendingCanvasStrokes = useSocketStore((state) => state.setPendingCanvasStrokes)

  const goToPlaying = useGamePhaseStore((state) => state.goToPlaying)
  const goToWaiting = useGamePhaseStore((state) => state.goToWaiting)
  const goToStart = useGamePhaseStore((state) => state.goToStart)

  useEffect(() => {

    // 소켓 연결 성공 — 세션이 있으면 재연결 시도
    socketClient.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected:', socketClient.id)

      const session = getSession()
      if (
        session?.gamePhase === GAME_PHASE.PLAYING &&
        session.socketId !== socketClient.id
      ) {
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
      if (!data?.roomId || !Array.isArray(data.users)) return

      setRoomId(data.roomId)
      setUsers(data.users)
      setHasJoined(true)

      // 입장·대기·게임 중 세션 갱신 (게임 종료 후 room_update 만 제외)
      if (!useSocketStore.getState().gameEndData) {
        const session = getSession()
        saveSession(
          data.roomId,
          nickname,
          socketClient.id,
          session?.gamePhase ?? GAME_PHASE.WAITING
        )
      }
    })

    // 채팅 메시지 수신
    socketClient.on('receive_chat', (data) => {
      addChatMessage(data)
    })

    // 게임 시작 핸들러 (game_start: 현재 서버 / game_started: gameManager 연결 후)
    const handleGameStart = (data) => {
      console.log('game_start(ed) 수신', data)
      setDrawer(data.drawer ?? null)
      setIsDrawer(data.drawer ? data.drawer.id === socketClient.id : data.canDraw ?? false)
      if (data.currentRound) setCurrentRound(data.currentRound)
      if (data.totalRounds) setTotalRounds(data.totalRounds)
      // users 스냅샷 저장 (game_end 화면 닉네임 매핑용)
      setGamePlayers(useSocketStore.getState().users)
      goToPlaying()

      const { roomId, nickname: storedNickname } = useSocketStore.getState()
      if (roomId && storedNickname) {
        saveSession(roomId, storedNickname, socketClient.id, GAME_PHASE.PLAYING)
      }
    }

    socketClient.on('game_start', handleGameStart)
    socketClient.on('game_started', handleGameStart)

    // 라운드 시작 (출제자에게만 topic 전달)
    socketClient.on('round_start', (data) => {
      console.log('round_start 수신', data)
      setCurrentRound(data.currentRound)
      setTotalRounds(data.totalRounds)
      setDrawer(data.drawer)
      setIsDrawer(data.drawer?.id === socketClient.id)
      if (data.topic) setTopic(data.topic)
      applyRoundTimerPayload(data, setRoundEndsAt, setTimeLeft)
    })

    // 정답자 발생
    socketClient.on('correct_answer', (data) => {
      console.log('correct_answer 수신', data)
      setScores(data.scores)
      setCorrectAnswerInfo({ nickname: data.nickname, point: data.point })
    })

    // 라운드 종료
    socketClient.on('round_end', (data) => {
      console.log('round_end 수신', data)
      setScores(data.scores)
      setRoundEndsAt(null)
    })

    // 다음 라운드
    socketClient.on('next_round', (data) => {
      console.log('next_round 수신', data)
      setCurrentRound(data.currentRound)
      setTotalRounds(data.totalRounds)
      setDrawer(data.drawer)
      setIsDrawer(data.drawer?.id === socketClient.id)
      setTopic('')
    })

    // 게임 종료
    socketClient.on('game_end', (data) => {
      console.log('game_end 수신', data)
      setRoundEndsAt(null)
      setGameEndData(data)
      if (data?.roomId && Array.isArray(data.users)) {
        setUsers(data.users)
      }
      clearSession()
    })

    // 재연결 성공 — 세션·게임 UI·캔버스·채팅 복원
    socketClient.on('reconnect_success', (data) => {
      console.log('reconnect_success 수신', data)

      const session = getSession()
      if (!session) return

      setRoomId(data.roomId)
      setUsers(data.users)
      setHasJoined(true)
      setNickname(session.nickname)

      if (session.gamePhase === GAME_PHASE.PLAYING) {
        if (Array.isArray(data.strokes)) {
          setPendingCanvasStrokes(data.strokes)
        }
        if (Array.isArray(data.chatLog)) {
          setChatList(data.chatLog)
        }
        if (data.currentRound) setCurrentRound(data.currentRound)
        if (data.totalRounds) setTotalRounds(data.totalRounds)
        if (data.drawer) setDrawer(data.drawer)
        setIsDrawer(data.drawer ? data.drawer.id === socketClient.id : Boolean(data.canDraw))
        if (data.topic) setTopic(data.topic)
        else setTopic('')
        if (data.scores) setScores(data.scores)
        setGamePlayers(data.users)
        applyRoundTimerPayload(data, setRoundEndsAt, setTimeLeft)
        goToPlaying()
      } else {
        goToWaiting()
      }

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
      socketClient.off('game_started')
      socketClient.off('round_start')
      socketClient.off('correct_answer')
      socketClient.off('round_end')
      socketClient.off('next_round')
      socketClient.off('game_end')
      socketClient.off('reconnect_success')
      socketClient.off('reconnect_fail')
      socketClient.off('error_message')
    }
  }, [nickname, setNickname, setRoomId, setUsers, addChatMessage, setChatList, setPendingCanvasStrokes, setIsConnected, setHasJoined, setErrorMessage, setIsDrawer, setDrawer, setTopic, setCurrentRound, setTotalRounds, setTimeLeft, setRoundEndsAt, setScores, setGamePlayers, setGameEndData, setCorrectAnswerInfo, goToPlaying, goToWaiting, goToStart])
}
