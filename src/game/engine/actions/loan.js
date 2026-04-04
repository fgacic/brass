const { LOAN_AMOUNT, MIN_INCOME_LEVEL } = require('../../constants')
const { deepClone, getPlayerById } = require('../state')
const { retreatIncomeLevels, getIncomeAtPosition } = require('../../data/progress-track')
const { advanceTurn } = require('../turn')

function validateLoan (state, playerId, { cardId }) {
  const player = getPlayerById(state, playerId)
  if (!player) return { valid: false, reason: 'Player not found' }
  if (player.actionsRemaining <= 0) return { valid: false, reason: 'No actions remaining' }

  if (state.drawDeck.length === 0 && state.era === 'rail') {
    return { valid: false, reason: 'Cannot take loan after draw deck exhausted in rail era' }
  }

  const newPosition = retreatIncomeLevels(player.incomeMarkerPosition, 3)
  const newIncome = getIncomeAtPosition(newPosition)
  if (newIncome < MIN_INCOME_LEVEL) {
    return { valid: false, reason: 'Would drop income below -10' }
  }

  return { valid: true }
}

function executeLoan (state, playerId, { cardId }) {
  const validation = validateLoan(state, playerId, { cardId })
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

  player.money += LOAN_AMOUNT
  player.incomeMarkerPosition = retreatIncomeLevels(player.incomeMarkerPosition, 3)

  newState.log.push({
    action: 'loan',
    playerId,
    details: { amount: LOAN_AMOUNT },
    timestamp: Date.now(),
  })

  return { state: advanceTurn(newState) }
}

module.exports = { validateLoan, executeLoan }
