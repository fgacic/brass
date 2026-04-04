'use client'

import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  gameState: null,
  selectedAction: null,
  selectedCard: null,
  targetingMode: null,
  selectedTargets: [],
  actionError: null,

  setGameState: (gameState) => set({ gameState }),

  setSelectedAction: (action) => set({
    selectedAction: action,
    selectedTargets: [],
    actionError: null,
  }),

  setSelectedCard: (cardId) => set({ selectedCard: cardId }),

  setTargetingMode: (mode) => set({ targetingMode: mode }),

  addTarget: (target) => set((s) => {
    const existing = s.selectedTargets.find(t => t.type === target.type && t.id === target.id)
    if (existing) {
      return { selectedTargets: s.selectedTargets.filter(t => t.id !== target.id) }
    }
    if (target.type === 'location' || target.type === 'connection') {
      return { selectedTargets: [target, ...s.selectedTargets.filter(t => t.type !== target.type)] }
    }
    return { selectedTargets: [...s.selectedTargets, target] }
  }),

  removeTarget: (targetId) => set((s) => ({
    selectedTargets: s.selectedTargets.filter(t => t.id !== targetId),
  })),

  setActionError: (error) => set({ actionError: error }),

  clearActionError: () => set({ actionError: null }),

  resetAction: () => set({
    selectedAction: null,
    selectedCard: null,
    targetingMode: null,
    selectedTargets: [],
    actionError: null,
  }),

  resetActionKeepCard: () => set((s) => ({
    selectedAction: null,
    targetingMode: null,
    selectedTargets: [],
    actionError: null,
  })),

  getCurrentPlayer: () => {
    const { gameState } = get()
    if (!gameState) return null
    const currentId = gameState.turnOrder[gameState.currentPlayerIndex]
    return gameState.players.find(p => p.id === currentId)
  },

  getMyPlayer: (myId) => {
    const { gameState } = get()
    if (!gameState) return null
    return gameState.players.find(p => p.id === myId)
  },

  isMyTurn: (myId) => {
    const { gameState } = get()
    if (!gameState) return false
    return gameState.turnOrder[gameState.currentPlayerIndex] === myId
  },
}))
