const { connections, TRUNK_ATTACHED_FARM } = require('../data/board-connections')

function addTrunkFarmEdges (adj, boardLinks, era) {
  const { trunkConnectionId, farmLocationId, endpointA, endpointB } = TRUNK_ATTACHED_FARM
  const conn = connections.find(c => c.id === trunkConnectionId)
  if (!conn) return
  const routeOk = era === 'canal' ? conn.canalRoute : conn.railRoute
  if (!routeOk) return
  const trunk = boardLinks[trunkConnectionId]
  if (!trunk || trunk.ownerId === null) return

  if (!adj[farmLocationId]) adj[farmLocationId] = []
  const edge = { connectionId: trunkConnectionId }
  adj[farmLocationId].push({ to: endpointA, ...edge }, { to: endpointB, ...edge })
  adj[endpointA].push({ to: farmLocationId, ...edge })
  adj[endpointB].push({ to: farmLocationId, ...edge })
}

function buildAdjacencyMap (boardLinks, era) {
  const adj = {}

  for (const conn of connections) {
    const isRouteAvailable = era === 'canal' ? conn.canalRoute : conn.railRoute
    if (!isRouteAvailable) continue

    const linkOnBoard = boardLinks[conn.id]
    const isBuilt = linkOnBoard && linkOnBoard.ownerId !== null

    if (!adj[conn.from]) adj[conn.from] = []
    if (!adj[conn.to]) adj[conn.to] = []

    if (isBuilt) {
      adj[conn.from].push({ to: conn.to, connectionId: conn.id })
      adj[conn.to].push({ to: conn.from, connectionId: conn.id })
    }
  }

  addTrunkFarmEdges(adj, boardLinks, era)
  return adj
}

function areConnected (boardLinks, era, locA, locB) {
  if (locA === locB) return true
  const adj = buildAdjacencyMap(boardLinks, era)
  const visited = new Set()
  const queue = [locA]
  visited.add(locA)

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === locB) return true

    const neighbors = adj[current] || []
    for (const { to } of neighbors) {
      if (!visited.has(to)) {
        visited.add(to)
        queue.push(to)
      }
    }
  }
  return false
}

function findShortestDistance (boardLinks, era, from, to) {
  if (from === to) return 0
  const adj = buildAdjacencyMap(boardLinks, era)
  const visited = new Set()
  const queue = [{ loc: from, dist: 0 }]
  visited.add(from)

  while (queue.length > 0) {
    const { loc, dist } = queue.shift()
    const neighbors = adj[loc] || []
    for (const { to: next } of neighbors) {
      if (next === to) return dist + 1
      if (!visited.has(next)) {
        visited.add(next)
        queue.push({ loc: next, dist: dist + 1 })
      }
    }
  }
  return Infinity
}

function findClosestCoalSource (boardLinks, era, fromLocation, industryTilesOnBoard) {
  const adj = buildAdjacencyMap(boardLinks, era)
  const visited = new Set()
  const queue = [{ loc: fromLocation, dist: 0 }]
  visited.add(fromLocation)
  const sources = []

  while (queue.length > 0) {
    const { loc, dist } = queue.shift()

    const tilesHere = industryTilesOnBoard.filter(
      t => t.locationId === loc && t.industry === 'coalMine' && !t.isFlipped && t.resourcesRemaining > 0
    )
    if (tilesHere.length > 0) {
      sources.push(...tilesHere.map(t => ({ tile: t, distance: dist })))
    }

    const neighbors = adj[loc] || []
    for (const { to } of neighbors) {
      if (!visited.has(to)) {
        visited.add(to)
        queue.push({ loc: to, dist: dist + 1 })
      }
    }
  }

  sources.sort((a, b) => a.distance - b.distance)
  return sources
}

function isConnectedToMerchant (boardLinks, era, fromLocation, merchantLocationId) {
  return areConnected(boardLinks, era, fromLocation, merchantLocationId)
}

function isConnectedToAnyMerchant (boardLinks, era, fromLocation, merchantLocations) {
  for (const mLoc of merchantLocations) {
    if (areConnected(boardLinks, era, fromLocation, mLoc)) return true
  }
  return false
}

function getPlayerNetwork (state, playerId) {
  const networkLocations = new Set()
  const era = state.era

  for (const tile of state.industryTilesOnBoard) {
    if (tile.ownerId === playerId) {
      networkLocations.add(tile.locationId)
    }
  }

  for (const conn of connections) {
    const link = state.board.links[conn.id]
    if (link && link.ownerId === playerId) {
      networkLocations.add(conn.from)
      networkLocations.add(conn.to)
      if (conn.id === TRUNK_ATTACHED_FARM.trunkConnectionId) {
        networkLocations.add(TRUNK_ATTACHED_FARM.farmLocationId)
      }
    }
  }

  return networkLocations
}

function isInPlayerNetwork (state, playerId, locationId) {
  const network = getPlayerNetwork(state, playerId)
  return network.has(locationId)
}

function playerHasNoTilesOnBoard (state, playerId) {
  const hasTiles = state.industryTilesOnBoard.some(t => t.ownerId === playerId)
  const hasLinks = Object.values(state.board.links).some(l => l.ownerId === playerId)
  return !hasTiles && !hasLinks
}

module.exports = {
  buildAdjacencyMap,
  areConnected,
  findShortestDistance,
  findClosestCoalSource,
  isConnectedToMerchant,
  isConnectedToAnyMerchant,
  getPlayerNetwork,
  isInPlayerNetwork,
  playerHasNoTilesOnBoard,
}
