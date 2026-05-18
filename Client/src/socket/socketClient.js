import { io } from 'socket.io-client'

export const socketClient = io('http://localhost:80', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})