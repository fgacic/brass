'use client'

import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  gameState: null,
  selectedAction: null,
  selectedCard: null,
  targetingMode: null,
  selectedTargets: [],
  buildIndustry: null,
  developIndustries: [],
  sellTiles: [],
  actionError: null,
  actionSubmitting: false,
  actionErrorTick: 0,

  setGameState: (gameState) => set({ gameState }),

  setActionSubmitting: (actionSubmitting) => set({ actionSubmitting }),

  setBuildIndustry: (buildIndustry) => set({ buildIndustry }),

  setDevelopIndustries: (developIndustries) => set({ developIndustries }),

  setSellTiles: (sellTiles) => set({ sellTiles }),

  setSelectedAction: (action) => set({
    selectedAction: action,
    selectedTargets: [],
    buildIndustry: null,
    developIndustries: [],
    sellTiles: [],
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

  setLocationTarget: (locationId) => set((s) => ({
    selectedTargets: [
      { type: 'location', id: locationId },
      ...s.selectedTargets.filter(t => t.type !== 'location'),
    ],
  })),

  removeTarget: (targetId) => set((s) => ({
    selectedTargets: s.selectedTargets.filter(t => t.id !== targetId),
  })),

  setActionError: (error) => set((s) => ({
    actionError: error,
    actionErrorTick: s.actionErrorTick + 1,
  })),

  clearActionError: () => set({ actionError: null }),

  resetAction: () => set({
    selectedAction: null,
    selectedCard: null,
    targetingMode: null,
    selectedTargets: [],
    buildIndustry: null,
    developIndustries: [],
    sellTiles: [],
    actionError: null,
    actionSubmitting: false,
  }),

  resetActionKeepCard: () => set((s) => ({
    selectedAction: null,
    targetingMode: null,
    selectedTargets: [],
    buildIndustry: null,
    developIndustries: [],
    sellTiles: [],
    actionError: null,
    actionSubmitting: false,
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
