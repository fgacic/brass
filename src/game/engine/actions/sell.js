const { INDUSTRY } = require('../../constants')
const { deepClone, getPlayerById } = require('../state')
const { areConnected } = require('../pathfinding')
const { consumeBeer, countAvailableBeer, flipTile } = require('../resources')
const { advanceTurn } = require('../turn')
const { advanceIncomeMarker } = require('../../data/progress-track')

const SELLABLE = [INDUSTRY.COTTON_MILL, INDUSTRY.MANUFACTURER, INDUSTRY.POTTERY]

function validateSell (state, playerId, { cardId, tileSells }) {
  const player = getPlayerById(state, playerId)
  if (!player) return { valid: false, reason: 'Player not found' }
  if (player.actionsRemaining <= 0) return { valid: false, reason: 'No actions remaining' }

  if (!tileSells || tileSells.length === 0) {
    return { valid: false, reason: 'Must sell at least one tile' }
  }

  for (const sell of tileSells) {
    const tile = state.industryTilesOnBoard.find(t => t.id === sell.tileId)
    if (!tile) return { valid: false, reason: 'Tile not found on board' }
    if (tile.ownerId !== playerId) return { valid: false, reason: 'Not your tile' }
    if (tile.isFlipped) return { valid: false, reason: 'Tile already flipped' }
    if (!SELLABLE.includes(tile.industry)) return { valid: false, reason: 'Cannot sell this industry type' }

    const merchant = state.board.merchants[sell.merchantLocationId]
    if (!merchant) return { valid: false, reason: 'Invalid merchant location' }

    const merchantAccepts = merchant.tiles.some(mt => mt.acceptedIndustries.includes(tile.industry))
    if (!merchantAccepts) return { valid: false, reason: 'Merchant does not accept this industry' }

    if (!areConnected(state.board.links, state.era, tile.locationId, sell.merchantLocationId)) {
      return { valid: false, reason: 'Not connected to merchant' }
    }

    const beerNeeded = tile.beerCost || 0
    if (beerNeeded > 0) {
      const availableBeer = countAvailableBeer(state, playerId, tile.locationId, sell.merchantLocationId)
      if (availableBeer < beerNeeded) return { valid: false, reason: 'Not enough beer' }
    }
  }

  return { valid: true }
}

function executeSell (state, playerId, { cardId, tileSells }) {
  const validation = validateSell(state, playerId, { cardId, tileSells })
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

  for (const sell of tileSells) {
    const tile = newState.industryTilesOnBoard.find(t => t.id === sell.tileId)
    const merchant = newState.board.merchants[sell.merchantLocationId]

    const beerNeeded = tile.beerCost || 0
    let usedMerchantBeer = false

    if (beerNeeded > 0) {
      if (merchant.beerAvailable && sell.useMerchantBeer !== false) {
        usedMerchantBeer = true
        consumeBeer(newState, playerId, tile.locationId, beerNeeded, sell.merchantLocationId)
      } else {
        consumeBeer(newState, playerId, tile.locationId, beerNeeded, null)
      }
    }

    tile.isFlipped = true
    player.incomeMarkerPosition = advanceIncomeMarker(player.incomeMarkerPosition, tile.incomeSteps)

    if (usedMerchantBeer) {
      applyMerchantBonus(newState, player, sell.merchantLocationId)
    }
  }

  newState.log.push({
    action: 'sell',
    playerId,
    details: { tiles: tileSells.map(s => s.tileId) },
    timestamp: Date.now(),
  })

  return { state: advanceTurn(newState) }
}

function applyMerchantBonus (state, player, merchantLocationId) {
  const merchantDef = require('../../data/merchants').merchantLocations.find(
    ml => ml.locationId === merchantLocationId
  )
  if (!merchantDef) return

  switch (merchantDef.bonusType) {
    case 'vp':
      player.vpMarker += merchantDef.bonusValue
      break
    case 'income':
      player.incomeMarkerPosition = advanceIncomeMarker(
        player.incomeMarkerPosition, merchantDef.bonusValue
      )
      break
    case 'money':
      player.money += merchantDef.bonusValue
      break
    case 'develop': {
      for (const [industry, tiles] of Object.entries(player.playerMat)) {
        if (tiles.length > 0 && !tiles[0].hasLightbulb) {
          tiles.shift()
          break
        }
      }
      break
    }
  }
}

module.exports = { validateSell, executeSell }
