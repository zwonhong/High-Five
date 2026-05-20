import { create } from 'zustand'
import { socketClient } from '../socket/socketClient'

export const GAME_PHASE = Object.freeze({
  START: 'start',
  JOIN: 'join',
  WAITING: 'waiting',
  PLAYING: 'playing',
  RESULT: 'result',
  EXIT: 'exit',
})

const GAME_PHASE_VALUES = Object.values(GAME_PHASE)

const INITIAL_GAME_PHASE_STATE = {
  gamePhase: GAME_PHASE.START,
  previousGamePhase: null,
}

function isValidGamePhase(gamePhase) {
  return GAME_PHASE_VALUES.includes(gamePhase)
}

function warnInvalidGamePhase(gamePhase) {
  console.warn(`[GamePhaseStore] Invalid game phase: ${gamePhase}`)
}

export const useGamePhaseStore = create((set, get) => ({
  ...INITIAL_GAME_PHASE_STATE,

  setGamePhase: (nextGamePhase) => {
    if (!isValidGamePhase(nextGamePhase)) {
      warnInvalidGamePhase(nextGamePhase)
      return
    }

    const currentGamePhase = get().gamePhase

    if (currentGamePhase === nextGamePhase) {
      return
    }

    set({
      previousGamePhase: currentGamePhase,
      gamePhase: nextGamePhase,
    })
  },

  goToStart: () => {
    socketClient.disconnect()
    get().setGamePhase(GAME_PHASE.START)
  },

  goToJoin: () => {
    get().setGamePhase(GAME_PHASE.JOIN)
  },

  goToWaiting: () => {
    get().setGamePhase(GAME_PHASE.WAITING)
  },

  goToPlaying: () => {
    get().setGamePhase(GAME_PHASE.PLAYING)
  },

  goToResult: () => {
    get().setGamePhase(GAME_PHASE.RESULT)
  },

  goToExit: () => {
    get().setGamePhase(GAME_PHASE.EXIT)
  },

  isCurrentPhase: (gamePhase) => {
    if (!isValidGamePhase(gamePhase)) {
      warnInvalidGamePhase(gamePhase)
      return false
    }

    return get().gamePhase === gamePhase
  },

  resetGamePhase: () => {
    set(INITIAL_GAME_PHASE_STATE)
  },
}))