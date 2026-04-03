const { createRoom, joinRoom, leaveRoom, getRoom, getRoomByPlayerId } = require('./rooms')
const { startGame, handleAction, filterStateForPlayer } = require('./game-manager')

const playerSockets = new Map()

function registerSocketHandlers (io) {
  io.on('connection', (socket) => {
    let currentPlayerId = null
    let currentRoomCode = null

    socket.on('room:create', ({ playerName }, callback) => {
      const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      currentPlayerId = playerId
      const player = { id: playerId, name: playerName }

      const room = createRoom(player)
      currentRoomCode = room.code
      socket.join(room.code)
      playerSockets.set(playerId, socket.id)

      callback({ success: true, room: sanitizeRoom(room), playerId })
    })

    socket.on('room:join', ({ roomCode, playerName }, callback) => {
      const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      currentPlayerId = playerId
      const player = { id: playerId, name: playerName }

      const result = joinRoom(roomCode, player)
      if (result.error) {
        callback({ success: false, error: result.error })
        return
      }

      currentRoomCode = roomCode
      socket.join(roomCode)
      playerSockets.set(playerId, socket.id)

      io.to(roomCode).emit('room:updated', sanitizeRoom(result.room))
      callback({ success: true, room: sanitizeRoom(result.room), playerId })
    })

    socket.on('room:leave', (callback) => {
      if (currentRoomCode && currentPlayerId) {
        const result = leaveRoom(currentRoomCode, currentPlayerId)
        socket.leave(currentRoomCode)
        playerSockets.delete(currentPlayerId)

        if (!result.deleted) {
          io.to(currentRoomCode).emit('room:updated', sanitizeRoom(result.room))
        }

        currentRoomCode = null
        currentPlayerId = null
      }
      if (callback) callback({ success: true })
    })

    socket.on('room:start', (callback) => {
      if (!currentRoomCode || !currentPlayerId) {
        callback({ success: false, error: 'Not in a room' })
        return
      }

      const room = getRoom(currentRoomCode)
      if (!room || room.host !== currentPlayerId) {
        callback({ success: false, error: 'Only host can start' })
        return
      }

      const result = startGame(currentRoomCode)
      if (result.error) {
        callback({ success: false, error: result.error })
        return
      }

      broadcastGameState(io, currentRoomCode, result.gameState)
      callback({ success: true })
    })

    socket.on('game:action', ({ actionType, payload }, callback) => {
      if (!currentRoomCode || !currentPlayerId) {
        if (callback) callback({ success: false, error: 'Not in a game' })
        return
      }

      try {
        const result = handleAction(currentRoomCode, currentPlayerId, actionType, payload)
        if (result.error) {
          if (callback) callback({ success: false, error: result.error })
          return
        }

        broadcastGameState(io, currentRoomCode, result.gameState)
        if (callback) callback({ success: true })
      } catch (err) {
        console.error('[game:action] Exception:', err)
        if (callback) callback({ success: false, error: err.message || 'Server error' })
      }
    })

    socket.on('room:reconnect', ({ roomCode, playerId }, callback) => {
      const room = getRoom(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      const player = room.players.find(p => p.id === playerId)
      if (!player) {
        callback({ success: false, error: 'Player not in room' })
        return
      }

      currentPlayerId = playerId
      currentRoomCode = roomCode
      socket.join(roomCode)
      playerSockets.set(playerId, socket.id)

      if (room.gameState) {
        const filtered = filterStateForPlayer(room.gameState, playerId)
        socket.emit('game:stateUpdate', filtered)
      }

      callback({ success: true, room: sanitizeRoom(room), playerId })
    })

    socket.on('disconnect', () => {
      if (currentPlayerId) {
        playerSockets.delete(currentPlayerId)
      }
    })
  })
}

function broadcastGameState (io, roomCode, gameState) {
  const room = getRoom(roomCode)
  if (!room) return

  for (const player of room.players) {
    const socketId = playerSockets.get(player.id)
    if (socketId) {
      const filtered = filterStateForPlayer(gameState, player.id)
      io.to(socketId).emit('game:stateUpdate', filtered)
    }
  }
}

function sanitizeRoom (room) {
  return {
    code: room.code,
    host: room.host,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    status: room.status,
  }
}

module.exports = { registerSocketHandlers }
