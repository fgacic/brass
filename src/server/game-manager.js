const { createInitialState, getCurrentPlayer } = require('../game/engine/state')
const { processAction } = require('../game/engine/actions')
const { processEndOfEra } = require('../game/engine/scoring')
const { PHASE } = require('../game/constants')
const { getRoom } = require('./rooms')

function startGame (roomCode) {
  const room = getRoom(roomCode)
  if (!room) return { error: 'Room not found' }
  if (room.players.length < 2) return { error: 'Need at least 2 players' }
  if (room.status !== 'waiting') return { error: 'Game already started' }

  const gameState = createInitialState(roomCode, room.players)
  room.gameState = gameState
  room.status = 'playing'

  return { gameState }
}

function handleAction (roomCode, playerId, actionType, payload) {
  const room = getRoom(roomCode)
  if (!room) return { error: 'Room not found' }
  if (!room.gameState) return { error: 'Game not started' }
  if (room.gameState.phase === PHASE.GAME_OVER) return { error: 'Game is over' }

  console.log(`[Action] ${playerId} -> ${actionType}`, JSON.stringify(payload))

  const result = processAction(room.gameState, playerId, actionType, payload)

  if (result.error) {
    console.log(`[Action Error] ${result.error}`)
    return { error: result.error }
  }

  let newState = result.state

  if (newState.phase === PHASE.END_OF_ERA) {
    newState = processEndOfEra(newState)
  }

  room.gameState = newState
  return { gameState: newState }
}

function filterStateForPlayer (gameState, playerId) {
  if (!gameState) return null

  const filtered = JSON.parse(JSON.stringify(gameState))

  filtered.players = filtered.players.map(p => {
    if (p.id === playerId) return p
    return {
      ...p,
      hand: undefined,
      handCount: p.hand ? p.hand.length : 0,
      discardPile: undefined,
    }
  })

  filtered.drawDeck = undefined
  filtered.drawDeckCount = gameState.drawDeck ? gameState.drawDeck.length : 0

  return filtered
}

function getGameState (roomCode) {
  const room = getRoom(roomCode)
  if (!room) return null
  return room.gameState
}

module.exports = { startGame, handleAction, filterStateForPlayer, getGameState }
