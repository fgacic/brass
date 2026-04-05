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

/** Link placement may branch from a location only if it is not solely a rival industry hub. */
function canUseLocationAsLinkHub (state, playerId, locationId) {
  const tilesHere = state.industryTilesOnBoard.filter(t => t.locationId === locationId)
  const hasMyIndustry = tilesHere.some(t => t.ownerId === playerId)
  const hasOpponentIndustry = tilesHere.some(t => t.ownerId !== playerId)
  return hasMyIndustry || !hasOpponentIndustry
}

/**
 * Locations you may chain new links from: your industries plus link endpoints that are valid hubs
 * (empty or only your industries at that city — not a shared city where only an opponent has industry).
 */
function getLinkHubNetwork (state, playerId) {
  const hubs = new Set()

  for (const tile of state.industryTilesOnBoard) {
    if (tile.ownerId === playerId) {
      hubs.add(tile.locationId)
    }
  }

  for (const conn of connections) {
    const link = state.board.links[conn.id]
    if (link && link.ownerId === playerId) {
      if (canUseLocationAsLinkHub(state, playerId, conn.from)) hubs.add(conn.from)
      if (canUseLocationAsLinkHub(state, playerId, conn.to)) hubs.add(conn.to)
      if (conn.id === TRUNK_ATTACHED_FARM.trunkConnectionId) {
        const farmId = TRUNK_ATTACHED_FARM.farmLocationId
        if (canUseLocationAsLinkHub(state, playerId, farmId)) hubs.add(farmId)
      }
    }
  }

  return hubs
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

/**
 * Each new link must touch reachable hubs (industries + own link endpoints except shared rival cities).
 * If you have no tiles and no links yet, the first segment only may be placed freely; further segments in
 * the same action must chain from hubs added after prior segments.
 */
function validateNewLinksTouchPlayerNetwork (state, playerId, connectionIds) {
  if (!connectionIds.length) return { ok: true }

  const reachable = new Set(getLinkHubNetwork(state, playerId))
  const noNetworkOnBoard = playerHasNoTilesOnBoard(state, playerId)

  for (let i = 0; i < connectionIds.length; i++) {
    const connId = connectionIds[i]
    const conn = connections.find(c => c.id === connId)
    if (!conn) return { ok: false, reason: 'Invalid connection' }

    const touches = reachable.has(conn.from) || reachable.has(conn.to)
    if (!touches) {
      if (!(noNetworkOnBoard && reachable.size === 0)) {
        return { ok: false, reason: 'Must be adjacent to your network' }
      }
    }

    if (conn.id === TRUNK_ATTACHED_FARM.trunkConnectionId) {
      const farmId = TRUNK_ATTACHED_FARM.farmLocationId
      if (canUseLocationAsLinkHub(state, playerId, farmId)) reachable.add(farmId)
    }
    for (const loc of [conn.from, conn.to]) {
      if (canUseLocationAsLinkHub(state, playerId, loc)) reachable.add(loc)
    }
  }

  return { ok: true }
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
  validateNewLinksTouchPlayerNetwork,
}
