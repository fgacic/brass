const rooms = new Map()

function generateRoomCode () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function createRoom (hostPlayer) {
  let code = generateRoomCode()
  while (rooms.has(code)) code = generateRoomCode()

  const room = {
    code,
    host: hostPlayer.id,
    players: [hostPlayer],
    status: 'waiting',
    gameState: null,
    createdAt: Date.now(),
  }

  rooms.set(code, room)
  return room
}

function joinRoom (code, player) {
  const room = rooms.get(code)
  if (!room) return { error: 'Room not found' }
  if (room.status !== 'waiting') return { error: 'Game already in progress' }
  if (room.players.length >= 4) return { error: 'Room is full' }
  if (room.players.find(p => p.id === player.id)) return { error: 'Already in room' }

  room.players.push(player)
  return { room }
}

function leaveRoom (code, playerId) {
  const room = rooms.get(code)
  if (!room) return { error: 'Room not found' }

  room.players = room.players.filter(p => p.id !== playerId)

  if (room.players.length === 0) {
    rooms.delete(code)
    return { deleted: true }
  }

  if (room.host === playerId) {
    room.host = room.players[0].id
  }

  return { room }
}

function getRoom (code) {
  return rooms.get(code) || null
}

function getRoomByPlayerId (playerId) {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.id === playerId)) return room
  }
  return null
}

function deleteRoom (code) {
  rooms.delete(code)
}

/**
 * Dev/testing: join an existing waiting dev room or create one with a fixed code.
 * @param {{ id: string, name: string }} player
 * @param {string} code — five-character room code (e.g. DEVLO)
 */
function joinOrCreateDevLobby (player, code) {
  const normalized = String(code || 'DEVLO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
  if (normalized.length !== 5) return { error: 'Dev room code must be 5 characters' }

  let room = rooms.get(normalized)
  if (!room) {
    room = {
      code: normalized,
      host: player.id,
      players: [player],
      status: 'waiting',
      gameState: null,
      createdAt: Date.now(),
    }
    rooms.set(normalized, room)
    return { room }
  }

  if (room.status !== 'waiting') return { error: 'Game already in progress' }
  if (room.players.length >= 4) return { error: 'Room is full' }
  if (room.players.find(p => p.id === player.id)) return { error: 'Already in room' }

  room.players.push(player)
  return { room }
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomByPlayerId,
  deleteRoom,
  joinOrCreateDevLobby,
}
