const { COAL_MARKET_EMPTY_PRICE, IRON_MARKET_EMPTY_PRICE } = require('../constants')
const { findClosestCoalSource, areConnected } = require('./pathfinding')
const { removeFromMarket, addToMarket } = require('../data/markets')

function merchantIdsInPlay (state) {
  return Object.keys(state.board?.merchants || {})
}

function consumeCoal (state, locationId, amount) {
  let remaining = amount
  let totalCost = 0

  const sources = findClosestCoalSource(state.board.links, state.era, locationId, state.industryTilesOnBoard)

  for (const source of sources) {
    if (remaining <= 0) break
    const tile = state.industryTilesOnBoard.find(t => t.id === source.tile.id)
    if (!tile || tile.resourcesRemaining <= 0) continue

    const take = Math.min(remaining, tile.resourcesRemaining)
    tile.resourcesRemaining -= take
    remaining -= take

    if (tile.resourcesRemaining === 0 && !tile.isFlipped) {
      flipTile(state, tile)
    }
  }

  if (remaining > 0) {
    const isConnectedToMarket = merchantIdsInPlay(state).some(
      ml => areConnected(state.board.links, state.era, locationId, ml)
    )

    if (isConnectedToMarket) {
      while (remaining > 0) {
        const boughtPrice = removeFromMarket(state.coalMarket)
        if (boughtPrice !== null) {
          totalCost += boughtPrice
        } else {
          totalCost += COAL_MARKET_EMPTY_PRICE
        }
        remaining--
      }
    }
  }

  return { success: remaining <= 0, cost: totalCost }
}

function consumeIron (state, amount) {
  let remaining = amount
  let totalCost = 0

  const ironTiles = state.industryTilesOnBoard.filter(
    t => t.industry === 'ironWorks' && !t.isFlipped && t.resourcesRemaining > 0
  )

  for (const tile of ironTiles) {
    if (remaining <= 0) break
    const take = Math.min(remaining, tile.resourcesRemaining)
    tile.resourcesRemaining -= take
    remaining -= take

    if (tile.resourcesRemaining === 0 && !tile.isFlipped) {
      flipTile(state, tile)
    }
  }

  while (remaining > 0) {
    const boughtPrice = removeFromMarket(state.ironMarket)
    if (boughtPrice !== null) {
      totalCost += boughtPrice
    } else {
      totalCost += IRON_MARKET_EMPTY_PRICE
    }
    remaining--
  }

  return { success: true, cost: totalCost }
}

function getTotalMerchantBeerAtLocation (merchant) {
  if (!merchant) return 0
  if (merchant.demandSlots?.length) {
    return merchant.demandSlots.reduce((a, s) => a + (s.merchantBeerRemaining || 0), 0)
  }
  return merchant.merchantBeerRemaining || 0
}

function consumeBeer (state, playerId, locationId, amount, merchantLocationId, saleIndustry) {
  let remaining = amount

  if (merchantLocationId) {
    const merchant = state.board.merchants[merchantLocationId]
    if (merchant?.demandSlots?.length) {
      while (remaining > 0) {
        const idx = merchant.demandSlots.findIndex((s) =>
          (s.merchantBeerRemaining || 0) > 0 &&
          (!saleIndustry || (s.acceptedIndustries || []).includes(saleIndustry))
        )
        if (idx < 0) break
        merchant.demandSlots[idx].merchantBeerRemaining--
        remaining--
      }
    } else if (merchant) {
      while (remaining > 0 && (merchant.merchantBeerRemaining || 0) > 0) {
        merchant.merchantBeerRemaining--
        remaining--
      }
    }
  }

  const ownBreweries = state.industryTilesOnBoard.filter(
    t => t.industry === 'brewery' && t.ownerId === playerId && !t.isFlipped && t.resourcesRemaining > 0
  )

  for (const tile of ownBreweries) {
    if (remaining <= 0) break
    const take = Math.min(remaining, tile.resourcesRemaining)
    tile.resourcesRemaining -= take
    remaining -= take

    if (tile.resourcesRemaining === 0 && !tile.isFlipped) {
      flipTile(state, tile)
    }
  }

  if (remaining > 0) {
    const opponentBreweries = state.industryTilesOnBoard.filter(
      t => t.industry === 'brewery' && t.ownerId !== playerId && !t.isFlipped && t.resourcesRemaining > 0
    )

    for (const tile of opponentBreweries) {
      if (remaining <= 0) break
      if (areConnected(state.board.links, state.era, locationId, tile.locationId)) {
        const take = Math.min(remaining, tile.resourcesRemaining)
        tile.resourcesRemaining -= take
        remaining -= take

        if (tile.resourcesRemaining === 0 && !tile.isFlipped) {
          flipTile(state, tile)
        }
      }
    }
  }

  return { success: remaining <= 0 }
}

function flipTile (state, tile) {
  tile.isFlipped = true
  const owner = state.players.find(p => p.id === tile.ownerId)
  if (owner) {
    const { advanceIncomeMarker } = require('../data/progress-track')
    owner.incomeMarkerPosition = advanceIncomeMarker(owner.incomeMarkerPosition, tile.incomeSteps)
  }
}

function canAffordCoal (state, locationId, amount) {
  const sources = findClosestCoalSource(state.board.links, state.era, locationId, state.industryTilesOnBoard)
  let freeCoal = 0
  for (const source of sources) {
    freeCoal += source.tile.resourcesRemaining
  }

  if (freeCoal >= amount) return { possible: true, cost: 0 }

  const marketNeeded = amount - freeCoal
  const isConnectedToMarket = merchantIdsInPlay(state).some(
    ml => areConnected(state.board.links, state.era, locationId, ml)
  )

  if (!isConnectedToMarket && freeCoal < amount) return { possible: false, cost: 0 }

  let cost = 0
  const tempMarket = JSON.parse(JSON.stringify(state.coalMarket))
  for (let i = 0; i < marketNeeded; i++) {
    const boughtPrice = removeFromMarket(tempMarket)
    if (boughtPrice !== null) {
      cost += boughtPrice
    } else {
      cost += COAL_MARKET_EMPTY_PRICE
    }
  }

  return { possible: true, cost }
}

function canAffordIron (state, amount) {
  const ironTiles = state.industryTilesOnBoard.filter(
    t => t.industry === 'ironWorks' && !t.isFlipped && t.resourcesRemaining > 0
  )
  let freeIron = 0
  for (const t of ironTiles) freeIron += t.resourcesRemaining
  if (freeIron >= amount) return { possible: true, cost: 0 }

  const marketNeeded = amount - freeIron
  let cost = 0
  const tempMarket = JSON.parse(JSON.stringify(state.ironMarket))
  for (let i = 0; i < marketNeeded; i++) {
    const boughtPrice = removeFromMarket(tempMarket)
    if (boughtPrice !== null) {
      cost += boughtPrice
    } else {
      cost += IRON_MARKET_EMPTY_PRICE
    }
  }

  return { possible: true, cost }
}

function countAvailableBeer (state, playerId, locationId, merchantLocationId, saleIndustry) {
  let total = 0

  if (merchantLocationId) {
    const merchant = state.board.merchants[merchantLocationId]
    if (merchant?.demandSlots?.length && saleIndustry) {
      for (const s of merchant.demandSlots) {
        if ((s.acceptedIndustries || []).includes(saleIndustry)) {
          total += s.merchantBeerRemaining || 0
        }
      }
    } else if (merchant) {
      total += getTotalMerchantBeerAtLocation(merchant)
    }
  }

  const ownBreweries = state.industryTilesOnBoard.filter(
    t => t.industry === 'brewery' && t.ownerId === playerId && !t.isFlipped && t.resourcesRemaining > 0
  )
  for (const t of ownBreweries) total += t.resourcesRemaining

  const opponentBreweries = state.industryTilesOnBoard.filter(
    t => t.industry === 'brewery' && t.ownerId !== playerId && !t.isFlipped && t.resourcesRemaining > 0
  )
  for (const tile of opponentBreweries) {
    if (areConnected(state.board.links, state.era, locationId, tile.locationId)) {
      total += tile.resourcesRemaining
    }
  }

  return total
}

function moveCubesToMarket (state, tile) {
  let moneyEarned = 0

  if (tile.industry === 'ironWorks') {
    while (tile.resourcesRemaining > 0) {
      const price = addToMarket(state.ironMarket)
      if (price === null) break
      tile.resourcesRemaining--
      moneyEarned += price
    }
  } else if (tile.industry === 'coalMine') {
    const linkedToMerchant = merchantIdsInPlay(state).some((ml) =>
      areConnected(state.board.links, state.era, tile.locationId, ml)
    )
    if (linkedToMerchant) {
      while (tile.resourcesRemaining > 0) {
        const price = addToMarket(state.coalMarket)
        if (price === null) break
        tile.resourcesRemaining--
        moneyEarned += price
      }
    }
  }

  if (tile.resourcesRemaining === 0 && !tile.isFlipped) {
    flipTile(state, tile)
  }

  return moneyEarned
}

module.exports = {
  consumeCoal, consumeIron, consumeBeer,
  flipTile, canAffordCoal, canAffordIron,
  countAvailableBeer, getTotalMerchantBeerAtLocation, moveCubesToMarket,
}
