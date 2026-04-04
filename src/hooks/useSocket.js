'use client'

import { useEffect, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { useLobbyStore } from '@/store/lobbyStore'
import { useGameStore } from '@/store/gameStore'

export function useSocket () {
  const { setRoom, setPlayerId, setError, setConnected } = useLobbyStore()
  const { setGameState } = useGameStore()

  useEffect(() => {
    const socket = getSocket()

    if (!socket.connected) socket.connect()

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('room:updated', (room) => setRoom(room))
    socket.on('game:stateUpdate', (state) => setGameState(state))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('room:updated')
      socket.off('game:stateUpdate')
    }
  }, [setRoom, setConnected, setGameState])

  const createRoom = useCallback((playerName) => {
    const socket = getSocket()
    socket.emit('room:create', { playerName }, (response) => {
      if (response.success) {
        setRoom(response.room)
        setPlayerId(response.playerId)
      } else {
        setError(response.error)
      }
    })
  }, [setRoom, setPlayerId, setError])

  const joinRoom = useCallback((roomCode, playerName) => {
    const socket = getSocket()
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName }, (response) => {
      if (response.success) {
        setRoom(response.room)
        setPlayerId(response.playerId)
      } else {
        setError(response.error)
      }
    })
  }, [setRoom, setPlayerId, setError])

  const startGame = useCallback(() => {
    const socket = getSocket()
    socket.emit('room:start', (response) => {
      if (!response.success) {
        setError(response.error)
      }
    })
  }, [setError])

  const leaveRoom = useCallback(() => {
    const socket = getSocket()
    socket.emit('room:leave', () => {
      useLobbyStore.getState().reset()
    })
  }, [])

  const reconnect = useCallback((roomCode, playerId) => {
    const socket = getSocket()
    socket.emit('room:reconnect', { roomCode, playerId }, (response) => {
      if (response.success) {
        setRoom(response.room)
        setPlayerId(response.playerId)
      }
    })
  }, [setRoom, setPlayerId])

  return { createRoom, joinRoom, startGame, leaveRoom, reconnect }
}
