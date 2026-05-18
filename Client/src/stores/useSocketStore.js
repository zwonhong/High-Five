import { create } from 'zustand'

export const useSocketStore = create((set) => ({
  nickname: '',
  roomId: '',
  users: [],
  chatInput: '',
  chatList: [],
  isConnected: false,
  hasJoined: false,
  errorMessage: '',
  isDrawer: false,

  setNickname: (nickname) => set({ nickname }),
  setRoomId: (roomId) => set({ roomId }),
  setUsers: (users) => set({ users }),
  setChatInput: (chatInput) => set({ chatInput }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setHasJoined: (hasJoined) => set({ hasJoined }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  clearErrorMessage: () => set({ errorMessage: '' }),
  setIsDrawer: (isDrawer) => set({ isDrawer }),

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
    }),
}))