const { deepClone, getPlayerById } = require('../state')
const { advanceTurn } = require('../turn')

function validateScout (state, playerId, { cardId, discardCardIds }) {
  const player = getPlayerById(state, playerId)
  if (!player) return { valid: false, reason: 'Player not found' }
  if (player.actionsRemaining <= 0) return { valid: false, reason: 'No actions remaining' }

  const hasWild = player.hand.some(c => c.type === 'wildLocation' || c.type === 'wildIndustry')
  if (hasWild) return { valid: false, reason: 'Cannot scout while holding wild cards' }

  if (!discardCardIds || discardCardIds.length !== 2) {
    return { valid: false, reason: 'Must discard exactly 2 additional cards' }
  }

  const allCardIds = [cardId, ...discardCardIds]
  for (const cid of allCardIds) {
    if (cid === 'wild_location' || cid === 'wild_industry') continue
    if (!player.hand.find(c => c.id === cid)) {
      return { valid: false, reason: `Card ${cid} not in hand` }
    }
  }

  const uniqueIds = new Set(allCardIds)
  if (uniqueIds.size !== allCardIds.length) {
    return { valid: false, reason: 'Cannot discard the same card twice' }
  }

  return { valid: true }
}

function executeScout (state, playerId, { cardId, discardCardIds }) {
  const validation = validateScout(state, playerId, { cardId, discardCardIds })
  if (!validation.valid) return { state, error: validation.reason }

  const newState = deepClone(state)
  const player = getPlayerById(newState, playerId)

  const allDiscards = [cardId, ...discardCardIds]
  for (const cid of allDiscards) {
    if (cid === 'wild_location' || cid === 'wild_industry') continue
    const idx = player.hand.findIndex(c => c.id === cid)
    if (idx >= 0) {
      const [discarded] = player.hand.splice(idx, 1)
      player.discardPile.push(discarded)
    }
  }

  player.hand.push(newState.wildCards.wildLocation)
  player.hand.push(newState.wildCards.wildIndustry)

  newState.log.push({
    action: 'scout',
    playerId,
    details: {},
    timestamp: Date.now(),
  })

  return { state: advanceTurn(newState) }
}

module.exports = { validateScout, executeScout }
