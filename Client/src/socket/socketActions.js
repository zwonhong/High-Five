import { socketClient } from './socketClient'

export function joinAutoRoom(nickname) {
  const trimmedNickname = nickname.trim()

  if (trimmedNickname === '') {
    return false
  }

  socketClient.emit('join_auto', trimmedNickname)
  return true
}

export function sendChatMessage(message) {
  const trimmedMessage = message.trim()

  if (trimmedMessage === '') {
    return false
  }

  socketClient.emit('send_chat', trimmedMessage)
  return true
}

export function tryReconnect(roomId, oldSocketId, nickname) {
  socketClient.emit('try_reconnect', { roomId, oldSocketId, nickname })
}