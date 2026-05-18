import { useEffect } from 'react'
import { socketClient } from '../socket/socketClient'
import { useSocketStore } from '../stores/useSocketStore'
import { useGamePhaseStore } from '../stores/useGamePhaseStore'

export function useSocketEvents() {
  const setRoomId = useSocketStore((state) => state.setRoomId)
  const setUsers = useSocketStore((state) => state.setUsers)
  const addChatMessage = useSocketStore((state) => state.addChatMessage)
  const setIsConnected = useSocketStore((state) => state.setIsConnected)
  const setHasJoined = useSocketStore((state) => state.setHasJoined)
  const setErrorMessage = useSocketStore((state) => state.setErrorMessage)
  const setIsDrawer = useSocketStore((state) => state.setIsDrawer)

  const goToPlaying = useGamePhaseStore((state) => state.goToPlaying)

  useEffect(() => {

    // 소켓 연결 성공
    socketClient.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected:', socketClient.id)
    })

    // 소켓 연결 해제
    socketClient.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    // 방 인원 변경 (입장/퇴장)
    socketClient.on('room_update', (data) => {
      setRoomId(data.roomId)
      setUsers(data.users)
      setHasJoined(true)
    })

    // 채팅 메시지 수신
    socketClient.on('receive_chat', (data) => {
      addChatMessage(data)
    })

    // 게임 시작 (5명 모두 입장 시 서버에서 전송)
    socketClient.on('game_start', (data) => {
      console.log('game_start 수신', data)
      setIsDrawer(data.canDraw ?? false)
      goToPlaying()
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
      socketClient.off('error_message')
    }
  }, [setRoomId, setUsers, addChatMessage, setIsConnected, setHasJoined, setErrorMessage, setIsDrawer, goToPlaying])
}
