const { ERA, INDUSTRY } = require('../../constants')
const { deepClone, getPlayerById } = require('../state')
const { locations } = require('../../data/locations')
const { getTileDefinition } = require('../../data/industries')
const { isInPlayerNetwork, playerHasNoTilesOnBoard } = require('../pathfinding')
const { consumeCoal, consumeIron, canAffordCoal, canAffordIron, moveCubesToMarket } = require('../resources')
const { advanceTurn } = require('../turn')
const { logMoneyCalc } = require('../money-audit')

function validateBuild (state, playerId, { cardId, locationId, industry }) {
  const player = getPlayerById(state, playerId)
  if (!player) return { valid: false, reason: 'Player not found' }
  if (player.actionsRemaining <= 0) return { valid: false, reason: 'No actions remaining' }

  const card = player.hand.find(c => c.id === cardId)
  if (!card && cardId !== 'wild_location' && cardId !== 'wild_industry') {
    return { valid: false, reason: 'Card not in hand' }
  }

  const location = locations[locationId]
  if (!location) return { valid: false, reason: 'Invalid location' }

  if (card && card.type === 'location' && card.locationId !== locationId) {
    return { valid: false, reason: 'Location card does not match' }
  }

  if (card && card.type === 'industry' && card.industry !== industry) {
    return { valid: false, reason: 'Industry card does not match' }
  }

  if (card && card.type === 'industry' || cardId === 'wild_industry') {
    if (!playerHasNoTilesOnBoard(state, playerId) && !isInPlayerNetwork(state, playerId, locationId)) {
      return { valid: false, reason: 'Location not in your network' }
    }
  }

  const locationBoard = state.board.locations[locationId]
  if (!locationBoard) return { valid: false, reason: 'Location not buildable' }

  const candidates = []
  for (let idx = 0; idx < locationBoard.slots.length; idx++) {
    const slot = locationBoard.slots[idx]
    if (slot.tileId !== null) continue
    const slotDef = location.industrySlots[idx]
    if (!slotDef?.allowedIndustries?.includes(industry)) continue
    const singleOnly = slotDef.allowedIndustries.length === 1
    candidates.push({ idx, singleOnly })
  }
  if (candidates.length === 0) return { valid: false, reason: 'No available slot for this industry' }
  candidates.sort((a, b) => {
    if (a.singleOnly !== b.singleOnly) return a.singleOnly ? -1 : 1
    return a.idx - b.idx
  })
  const slotIndex = candidates[0].idx

  if (state.era === ERA.CANAL) {
    const playerHasTileHere = state.industryTilesOnBoard.some(
      t => t.ownerId === playerId && t.locationId === locationId
    )
    if (playerHasTileHere) return { valid: false, reason: 'Canal era: max 1 tile per location' }
  }

  const tiles = player.playerMat[industry]
  if (!tiles || tiles.length === 0) return { valid: false, reason: 'No tiles available' }

  const tile = tiles[0]

  if (tile.isLocked) return { valid: false, reason: 'Tile is locked, use Develop first' }
  if (state.era === ERA.RAIL && tile.level === 1 && !tile.canBuildInRail) {
    return { valid: false, reason: 'Cannot build level 1 in rail era' }
  }
  if (state.era === ERA.CANAL && !tile.canBuildInCanal) {
    return { valid: false, reason: 'Cannot build this tile in canal era' }
  }

  let totalCost = tile.cost
  if (tile.coalCost > 0) {
    const coalCheck = canAffordCoal(state, locationId, tile.coalCost)
    if (!coalCheck.possible) return { valid: false, reason: 'Cannot access coal' }
    totalCost += coalCheck.cost
  }
  if (tile.ironCost > 0) {
    const ironCheck = canAffordIron(state, tile.ironCost)
    totalCost += ironCheck.cost
  }

  if (player.money < totalCost) return { valid: false, reason: 'Not enough money' }

  return { valid: true, slotIndex, tile, totalCost }
}

function executeBuild (state, playerId, { cardId, locationId, industry }) {
  const validation = validateBuild(state, playerId, { cardId, locationId, industry })
  if (!validation.valid) return { state, error: validation.reason }

  const newState = deepClone(state)
  const player = getPlayerById(newState, playerId)
  const { slotIndex } = validation

  const tile = player.playerMat[industry].shift()

  if (cardId === 'wild_location' || cardId === 'wild_industry') {
    // Wild cards go back to supply, not discard
  } else {
    const cardIndex = player.hand.findIndex(c => c.id === cardId)
    const [discarded] = player.hand.splice(cardIndex, 1)
    player.discardPile.push(discarded)
  }

  let resourcesOnTile = 0
  if (tile.resourceType === 'beer') {
    resourcesOnTile = newState.era === ERA.CANAL
      ? (tile.beerSlotsCanal || tile.resourceSlots)
      : (tile.beerSlotsRail || tile.resourceSlots)
  } else if (tile.resourceSlots > 0) {
    resourcesOnTile = tile.resourceSlots
  }

  const boardTile = {
    id: tile.id,
    ownerId: playerId,
    locationId,
    slotIndex,
    industry,
    level: tile.level,
    isFlipped: false,
    resourcesRemaining: resourcesOnTile,
    vp: tile.vp,
    incomeSteps: tile.incomeSteps,
    linkVP: tile.linkVP,
    cost: tile.cost,
    beerCost: tile.beerCost || 0,
    coalCost: tile.coalCost || 0,
    flipsOnSell: tile.flipsOnSell || false,
    flipsOnEmpty: tile.flipsOnEmpty || false,
  }

  newState.industryTilesOnBoard.push(boardTile)
  const existingSlot = newState.board.locations[locationId].slots[slotIndex]
  newState.board.locations[locationId].slots[slotIndex] = {
    ...existingSlot,
    tileId: tile.id,
    ownerId: playerId,
  }

  const balanceBefore = player.money
  let coalPaid = 0
  let ironPaid = 0
  let cubeIncome = 0

  player.money -= tile.cost
  player.moneySpentThisRound += tile.cost

  if (tile.coalCost > 0) {
    const coalResult = consumeCoal(newState, locationId, tile.coalCost)
    coalPaid = coalResult.cost
    player.money -= coalPaid
    player.moneySpentThisRound += coalPaid
  }

  if (tile.ironCost > 0) {
    const ironResult = consumeIron(newState, tile.ironCost)
    ironPaid = ironResult.cost
    player.money -= ironPaid
    player.moneySpentThisRound += ironPaid
  }

  if (tile.resourceType === 'iron' || tile.resourceType === 'coal') {
    const placedTile = newState.industryTilesOnBoard.find(t => t.id === tile.id)
    cubeIncome = moveCubesToMarket(newState, placedTile)
    player.money += cubeIncome
  }

  logMoneyCalc('build', {
    playerId,
    locationId,
    industry,
    level: tile.level,
    paidPounds: { tile: tile.cost, coal: coalPaid, iron: ironPaid },
    cubeIncome,
    balanceBefore,
    balanceAfter: player.money,
  })

  newState.log.push({
    action: 'build',
    playerId,
    details: { industry, level: tile.level, locationId },
    timestamp: Date.now(),
  })

  return { state: advanceTurn(newState) }
}

module.exports = { validateBuild, executeBuild }
