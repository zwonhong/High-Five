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
  // 현재 출제자 { id, nickname }
  drawer: null,
  // 현재 라운드 주제 (출제자에게만 표시)
  topic: '',
  // 라운드 정보 (game_started / round_start 수신 시 갱신)
  currentRound: 1,
  totalRounds: 5,
  // 플레이어별 점수 { socketId: score }
  scores: {},
  // 게임 시작 시 플레이어 목록 스냅샷 (게임 종료 화면용)
  gamePlayers: [],
  // 게임 종료 데이터 { scores, winner }
  gameEndData: null,
  // 최근 정답자 정보 { nickname, point }
  correctAnswerInfo: null,

  setNickname: (nickname) => set({ nickname }),
  setRoomId: (roomId) => set({ roomId }),
  setUsers: (users) => set({ users }),
  setChatInput: (chatInput) => set({ chatInput }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setHasJoined: (hasJoined) => set({ hasJoined }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  clearErrorMessage: () => set({ errorMessage: '' }),
  setIsDrawer: (isDrawer) => set({ isDrawer }),
  setDrawer: (drawer) => set({ drawer }),
  setTopic: (topic) => set({ topic }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setTotalRounds: (totalRounds) => set({ totalRounds }),
  setScores: (scores) => set({ scores }),
  setGamePlayers: (gamePlayers) => set({ gamePlayers }),
  setGameEndData: (gameEndData) => set({ gameEndData }),
  setCorrectAnswerInfo: (correctAnswerInfo) => set({ correctAnswerInfo }),

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
      drawer: null,
      topic: '',
      currentRound: 1,
      totalRounds: 5,
      scores: {},
      gamePlayers: [],
      gameEndData: null,
      correctAnswerInfo: null,
    }),
}))
