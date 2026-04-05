const { getLocationById } = require('./data/locations')

function getIronAvailableCount (gameState) {
  if (!gameState) return 0
  const tiles = gameState.industryTilesOnBoard || []
  let onBoard = 0
  for (const t of tiles) {
    if (t.industry === 'ironWorks' && !t.isFlipped) {
      onBoard += t.resourcesRemaining || 0
    }
  }
  return onBoard
}

function getCoalByLocation (gameState) {
  if (!gameState) {
    return { rows: [], totalBoard: 0 }
  }
  const tiles = gameState.industryTilesOnBoard || []
  const byLoc = new Map()
  for (const t of tiles) {
    if (t.industry !== 'coalMine' || t.isFlipped) continue
    const n = t.resourcesRemaining || 0
    if (n <= 0) continue
    const id = t.locationId
    byLoc.set(id, (byLoc.get(id) || 0) + n)
  }
  const rows = []
  let totalBoard = 0
  for (const [locationId, count] of byLoc) {
    totalBoard += count
    const loc = getLocationById(locationId)
    const name = loc?.name || locationId
    rows.push({ locationId, name, count })
  }
  rows.sort((a, b) => a.name.localeCompare(b.name))
  return { rows, totalBoard }
}

module.exports = {
  getIronAvailableCount,
  getCoalByLocation,
}
