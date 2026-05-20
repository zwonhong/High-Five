import { socketClient } from './socketClient'

export function joinAutoRoom(nickname) {
  const trimmedNickname = nickname.trim()

  if (trimmedNickname === '') {
    return false
  }

  socketClient.connect()
  socketClient.emit('join_auto', trimmedNickname)
  return true
}

export function sendChatMessage(message, inAnswer = false) {
  const trimmedMessage = message.trim()

  if (trimmedMessage === '') {
    return false
  }

  socketClient.emit('send_chat', { message: trimmedMessage, inAnswer })
  return true
}

export function tryReconnect(roomId, oldSocketId, nickname) {
  socketClient.emit('try_reconnect', { roomId, oldSocketId, nickname })
}