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
    socketClient.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected:', socketClient.id)
    })

    socketClient.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    socketClient.on('room_update', (data) => {
      setRoomId(data.roomId)
      setUsers(data.users)
      setHasJoined(true)
    })

    socketClient.on('receive_chat', (data) => {
      addChatMessage(data)
    })

    socketClient.on('game_start', (data) => {
      console.log('game_start 수신', data)
      setIsDrawer(data.canDraw ?? false)
      goToPlaying()
    })

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
