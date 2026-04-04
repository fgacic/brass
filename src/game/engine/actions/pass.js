const { deepClone, getPlayerById } = require('../state')
const { advanceTurn } = require('../turn')

function validatePass (state, playerId, { cardId }) {
  const player = getPlayerById(state, playerId)
  if (!player) return { valid: false, reason: 'Player not found' }
  if (player.actionsRemaining <= 0) return { valid: false, reason: 'No actions remaining' }

  return { valid: true }
}

function executePass (state, playerId, { cardId }) {
  const validation = validatePass(state, playerId, { cardId })
  if (!validation.valid) return { state, error: validation.reason }

  const newState = deepClone(state)
  const player = getPlayerById(newState, playerId)

  if (cardId === 'wild_location' || cardId === 'wild_industry') {
    // Wild cards return to supply
  } else {
    const cardIndex = player.hand.findIndex(c => c.id === cardId)
    if (cardIndex >= 0) {
      const [discarded] = player.hand.splice(cardIndex, 1)
      player.discardPile.push(discarded)
    }
  }

  newState.log.push({
    action: 'pass',
    playerId,
    details: {},
    timestamp: Date.now(),
  })

  return { state: advanceTurn(newState) }
}

module.exports = { validatePass, executePass }
