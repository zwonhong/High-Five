import { create } from 'zustand'

export const useSocketStore = create((set) => ({
  nickname: '',
  roomId: '',
  users: [],
  chatInput: '',
  chatList: [],
  isConnected: false,
  hasJoined: false,
  // 서버 에러 메시지 (닉네임 중복, 방 만석 등)
  errorMessage: '',
  // 현재 그리기 권한 여부
  isDrawer: false,
  // 라운드 정보 (서버에서 game_start 시 전달)
  timeLimit: 60,
  maxRound: 3,

  setNickname: (nickname) => set({ nickname }),
  setRoomId: (roomId) => set({ roomId }),
  setUsers: (users) => set({ users }),
  setChatInput: (chatInput) => set({ chatInput }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setHasJoined: (hasJoined) => set({ hasJoined }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  clearErrorMessage: () => set({ errorMessage: '' }),
  setIsDrawer: (isDrawer) => set({ isDrawer }),
  setTimeLimit: (timeLimit) => set({ timeLimit }),
  setMaxRound: (maxRound) => set({ maxRound }),

  addChatMessage: (chatMessage) =>
    set((state) => ({
      chatList: [...state.chatList, chatMessage],
    })),

  resetSocketState: () =>
    set({
      nickname: '',
      roomId: '',
      users: [],
      chatInput: '',
      chatList: [],
      isConnected: false,
      hasJoined: false,
      errorMessage: '',
      isDrawer: false,
      timeLimit: 60,
      maxRound: 3,
    }),
}))