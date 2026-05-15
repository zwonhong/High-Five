import { useEffect } from 'react'
import { socketClient } from '../socket/socketClient'
import { useSocketStore } from '../stores/useSocketStore'

export function useSocketEvents() {
  const setRoomId = useSocketStore((state) => state.setRoomId)
  const setUsers = useSocketStore((state) => state.setUsers)
  const addChatMessage = useSocketStore((state) => state.addChatMessage)
  const setIsConnected = useSocketStore((state) => state.setIsConnected)
  const setHasJoined = useSocketStore((state) => state.setHasJoined)

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

    return () => {
      socketClient.off('connect')
      socketClient.off('disconnect')
      socketClient.off('room_update')
      socketClient.off('receive_chat')
    }
  }, [setRoomId, setUsers, addChatMessage, setIsConnected, setHasJoined])
}