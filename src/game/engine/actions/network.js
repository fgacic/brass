const { ERA, CANAL_LINK_COST, SINGLE_RAIL_COST, DOUBLE_RAIL_COST } = require('../../constants')
const { deepClone, getPlayerById } = require('../state')
const { connections } = require('../../data/board-connections')
const { validateNewLinksTouchPlayerNetwork } = require('../pathfinding')
const { consumeCoal, consumeBeer, canAffordCoal, countAvailableBeer } = require('../resources')
const { advanceTurn } = require('../turn')
const { logMoneyCalc } = require('../money-audit')

function validateNetwork (state, playerId, { cardId, connectionIds }) {
  const player = getPlayerById(state, playerId)
  if (!player) return { valid: false, reason: 'Player not found' }
  if (player.actionsRemaining <= 0) return { valid: false, reason: 'No actions remaining' }

  if (!connectionIds || connectionIds.length === 0) return { valid: false, reason: 'No connections specified' }

  if (state.era === ERA.CANAL) {
    if (connectionIds.length > 1) return { valid: false, reason: 'Canal era: max 1 link per action' }

    const conn = connections.find(c => c.id === connectionIds[0])
    if (!conn) return { valid: false, reason: 'Invalid connection' }
    if (!conn.canalRoute) return { valid: false, reason: 'Not a canal route' }

    const link = state.board.links[conn.id]
    if (link && link.ownerId !== null) return { valid: false, reason: 'Link already built' }

    const touch = validateNewLinksTouchPlayerNetwork(state, playerId, [conn.id])
    if (!touch.ok) return { valid: false, reason: touch.reason }

    if (player.money < CANAL_LINK_COST) return { valid: false, reason: 'Not enough money' }
    if (player.linkTilesRemaining <= 0) return { valid: false, reason: 'No link tiles remaining' }

    return { valid: true, cost: CANAL_LINK_COST, coalCost: 0, beerCost: 0 }
  }

  // Rail era
  if (connectionIds.length > 2) return { valid: false, reason: 'Max 2 rail links per action' }

  for (const connId of connectionIds) {
    const conn = connections.find(c => c.id === connId)
    if (!conn) return { valid: false, reason: `Invalid connection: ${connId}` }
    if (!conn.railRoute) return { valid: false, reason: 'Not a rail route' }

    const link = state.board.links[conn.id]
    if (link && link.ownerId !== null) return { valid: false, reason: 'Link already built' }
  }

  if (player.linkTilesRemaining < connectionIds.length) {
    return { valid: false, reason: 'Not enough link tiles' }
  }

  const touchRail = validateNewLinksTouchPlayerNetwork(state, playerId, connectionIds)
  if (!touchRail.ok) return { valid: false, reason: touchRail.reason }

  const cost = connectionIds.length === 1 ? SINGLE_RAIL_COST : DOUBLE_RAIL_COST
  const coalNeeded = connectionIds.length
  const beerNeeded = connectionIds.length === 2 ? 1 : 0

  // Check coal affordability for each link
  for (const connId of connectionIds) {
    const conn = connections.find(c => c.id === connId)
    const coalCheck = canAffordCoal(state, conn.to, 1)
    if (!coalCheck.possible) {
      const coalCheck2 = canAffordCoal(state, conn.from, 1)
      if (!coalCheck2.possible) return { valid: false, reason: 'Cannot access coal for rail link' }
    }
  }

  let totalCost = cost
  if (player.money < totalCost) return { valid: false, reason: 'Not enough money' }

  return { valid: true, cost, coalCost: coalNeeded, beerCost: beerNeeded }
}

function executeNetwork (state, playerId, { cardId, connectionIds }) {
  const validation = validateNetwork(state, playerId, { cardId, connectionIds })
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

  const linkType = newState.era === ERA.CANAL ? 'canal' : 'rail'
  const balanceBefore = player.money
  let railCoalPaid = 0

  for (const connId of connectionIds) {
    newState.board.links[connId] = { ownerId: playerId, type: linkType }
    player.linkTilesRemaining--

    if (newState.era === ERA.RAIL) {
      const conn = connections.find(c => c.id === connId)
      const coalResult = consumeCoal(newState, conn.to, 1)
      railCoalPaid += coalResult.cost
      player.money -= coalResult.cost
      player.moneySpentThisRound += coalResult.cost
    }
  }

  player.money -= validation.cost
  player.moneySpentThisRound += validation.cost

  logMoneyCalc('network', {
    playerId,
    era: linkType,
    connectionCount: connectionIds.length,
    linkFee: validation.cost,
    railCoalPaid,
    balanceBefore,
    balanceAfter: player.money,
  })

  if (validation.beerCost > 0) {
    const lastConn = connections.find(c => c.id === connectionIds[connectionIds.length - 1])
    consumeBeer(newState, playerId, lastConn.to, validation.beerCost, null)
  }

  newState.log.push({
    action: 'network',
    playerId,
    details: { connectionIds, type: linkType },
    timestamp: Date.now(),
  })

  return { state: advanceTurn(newState) }
}

module.exports = { validateNetwork, executeNetwork }
