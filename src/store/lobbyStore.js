'use client'

import { create } from 'zustand'

export const useLobbyStore = create((set) => ({
  room: null,
  playerId: null,
  playerName: '',
  error: null,
  isConnected: false,

  setRoom: (room) => set({ room, error: null }),
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (playerName) => set({ playerName }),
  setError: (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  reset: () => set({ room: null, playerId: null, error: null }),
}))
