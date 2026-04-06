'use client'

import { useEffect, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import {
  saveBrassSession,
  readBrassSession,
  clearBrassSession,
} from '@/lib/brass-session'
import { useLobbyStore } from '@/store/lobbyStore'
import { useGameStore } from '@/store/gameStore'

function handleReconnectResponse (response) {
  if (response.success) {
    useLobbyStore.getState().setRoom(response.room)
    useLobbyStore.getState().setPlayerId(response.playerId)
    return
  }
  clearBrassSession()
  useLobbyStore.getState().reset()
  useGameStore.getState().setGameState(null)
  useLobbyStore.getState().setError(response.error || 'Could not restore session')
}

export function useSocket () {
  const { setRoom, setPlayerId, setError, setConnected } = useLobbyStore()
  const { setGameState } = useGameStore()

  useEffect(() => {
    const socket = getSocket()

    if (!socket.connected) socket.connect()

    const onConnect = () => {
      setConnected(true)
      const session = readBrassSession()
      if (!session) return
      const lobby = useLobbyStore.getState()
      const game = useGameStore.getState()
      const inLobbyOrGame =
        !!game.gameState ||
        (!!lobby.room &&
          lobby.playerId === session.playerId &&
          lobby.room.code === session.roomCode)
      if (!inLobbyOrGame) return
      socket.emit(
        'room:reconnect',
        { roomCode: session.roomCode, playerId: session.playerId },
        handleReconnectResponse
      )
    }

    const onDisconnect = () => setConnected(false)
    const onRoomUpdated = (room) => setRoom(room)
    const onStateUpdate = (state) => setGameState(state)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('room:updated', onRoomUpdated)
    socket.on('game:stateUpdate', onStateUpdate)

    if (socket.connected) {
      onConnect()
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room:updated', onRoomUpdated)
      socket.off('game:stateUpdate', onStateUpdate)
    }
  }, [setRoom, setConnected, setGameState])

  const createRoom = useCallback((playerName) => {
    const socket = getSocket()
    socket.emit('room:create', { playerName }, (response) => {
      if (response.success) {
        setRoom(response.room)
        setPlayerId(response.playerId)
        saveBrassSession({
          roomCode: response.room.code,
          playerId: response.playerId,
        })
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
        saveBrassSession({
          roomCode: response.room.code,
          playerId: response.playerId,
        })
      } else {
        setError(response.error)
      }
    })
  }, [setRoom, setPlayerId, setError])

  const devQuickJoin = useCallback((playerName) => {
    const socket = getSocket()
    socket.emit('room:devJoin', { playerName: playerName || '' }, (response) => {
      if (response.success) {
        setRoom(response.room)
        setPlayerId(response.playerId)
        saveBrassSession({
          roomCode: response.room.code,
          playerId: response.playerId,
        })
      } else {
        setError(response.error || 'Dev join failed')
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
      clearBrassSession()
      useLobbyStore.getState().reset()
      useGameStore.getState().setGameState(null)
    })
  }, [])

  const reconnect = useCallback((roomCode, playerId) => {
    const socket = getSocket()
    socket.emit('room:reconnect', { roomCode, playerId }, (response) => {
      handleReconnectResponse(response)
      if (response.success) {
        saveBrassSession({
          roomCode: response.room.code,
          playerId: response.playerId,
        })
      }
    })
  }, [])

  return { createRoom, joinRoom, devQuickJoin, startGame, leaveRoom, reconnect }
}
