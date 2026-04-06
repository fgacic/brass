const { deepClone, getPlayerById } = require('../state')
const { consumeIron, canAffordIron } = require('../resources')
const { advanceTurn } = require('../turn')
const { logMoneyCalc } = require('../money-audit')

function validateDevelop (state, playerId, { cardId, industries }) {
  const player = getPlayerById(state, playerId)
  if (!player) return { valid: false, reason: 'Player not found' }
  if (player.actionsRemaining <= 0) return { valid: false, reason: 'No actions remaining' }

  if (!industries || industries.length === 0 || industries.length > 2) {
    return { valid: false, reason: 'Must develop 1 or 2 tiles' }
  }

  for (const industry of industries) {
    const tiles = player.playerMat[industry]
    if (!tiles || tiles.length === 0) {
      return { valid: false, reason: `No ${industry} tiles to develop` }
    }
    const lowestTile = tiles[0]
    if (lowestTile.hasLightbulb) {
      return { valid: false, reason: 'Cannot develop pottery with lightbulb icon' }
    }
  }

  const ironNeeded = industries.length
  const ironCheck = canAffordIron(state, ironNeeded)

  const totalCost = ironCheck.cost
  if (player.money < totalCost) return { valid: false, reason: 'Not enough money for iron' }

  return { valid: true, cost: totalCost, ironNeeded }
}

function executeDevelop (state, playerId, { cardId, industries }) {
  const validation = validateDevelop(state, playerId, { cardId, industries })
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

  for (const industry of industries) {
    player.playerMat[industry].shift()
  }

  const balanceBefore = player.money
  const ironResult = consumeIron(newState, industries.length)
  player.money -= ironResult.cost
  player.moneySpentThisRound += ironResult.cost

  logMoneyCalc('develop', {
    playerId,
    industries,
    ironCubesConsumed: industries.length,
    ironSpend: ironResult.cost,
    balanceBefore,
    balanceAfter: player.money,
  })

  newState.log.push({
    action: 'develop',
    playerId,
    details: { industries },
    timestamp: Date.now(),
  })

  return { state: advanceTurn(newState) }
}

module.exports = { validateDevelop, executeDevelop }
