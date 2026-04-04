/** Farm location only reachable when this trunk link is built (pathfinding + player network). */
const TRUNK_ATTACHED_FARM = {
  trunkConnectionId: 'kidderminster-worcester',
  farmLocationId: 'farmBrewery2',
  endpointA: 'kidderminster',
  endpointB: 'worcester',
}

const connections = [
  // Warrington
  { id: 'warrington-stokeOnTrent', from: 'warrington', to: 'stokeOnTrent', canalRoute: true, railRoute: true },

  // Stoke-on-Trent
  { id: 'stokeOnTrent-leek', from: 'stokeOnTrent', to: 'leek', canalRoute: true, railRoute: true },
  { id: 'stokeOnTrent-stone', from: 'stokeOnTrent', to: 'stone', canalRoute: true, railRoute: true },

  // Leek
  { id: 'leek-belper', from: 'leek', to: 'belper', canalRoute: false, railRoute: true },

  // Stone
  { id: 'stone-uttoxeter', from: 'stone', to: 'uttoxeter', canalRoute: false, railRoute: true },
  { id: 'stone-stafford', from: 'stone', to: 'stafford', canalRoute: true, railRoute: true },

  // Uttoxeter
  { id: 'uttoxeter-derby', from: 'uttoxeter', to: 'derby', canalRoute: false, railRoute: true },

  // Derby
  { id: 'derby-belper', from: 'derby', to: 'belper', canalRoute: true, railRoute: true },
  { id: 'derby-nottingham', from: 'derby', to: 'nottingham', canalRoute: true, railRoute: true },
  { id: 'derby-burtonOnTrent', from: 'derby', to: 'burtonOnTrent', canalRoute: true, railRoute: true },

  // Stafford
  { id: 'stafford-cannock', from: 'stafford', to: 'cannock', canalRoute: true, railRoute: true },

  // Cannock
  { id: 'cannock-farmBrewery1', from: 'cannock', to: 'farmBrewery1', canalRoute: true, railRoute: true },
  { id: 'cannock-burtonOnTrent', from: 'cannock', to: 'burtonOnTrent', canalRoute: false, railRoute: true },
  { id: 'cannock-wolverhampton', from: 'cannock', to: 'wolverhampton', canalRoute: true, railRoute: true },

  // Wolverhampton
  { id: 'wolverhampton-coalbrookdale', from: 'wolverhampton', to: 'coalbrookdale', canalRoute: true, railRoute: true },
  { id: 'wolverhampton-walsall', from: 'wolverhampton', to: 'walsall', canalRoute: true, railRoute: true },

  // Coalbrookdale
  { id: 'coalbrookdale-shrewsbury', from: 'coalbrookdale', to: 'shrewsbury', canalRoute: true, railRoute: true },
  { id: 'coalbrookdale-kidderminster', from: 'coalbrookdale', to: 'kidderminster', canalRoute: true, railRoute: true },

  // Walsall
  { id: 'walsall-birmingham', from: 'walsall', to: 'birmingham', canalRoute: true, railRoute: true },
  { id: 'walsall-cannock', from: 'walsall', to: 'cannock', canalRoute: true, railRoute: true },
  { id: 'walsall-tamworth', from: 'walsall', to: 'tamworth', canalRoute: false, railRoute: true },

  // Tamworth
  { id: 'tamworth-burtonOnTrent', from: 'tamworth', to: 'burtonOnTrent', canalRoute: true, railRoute: true },
  { id: 'tamworth-nuneaton', from: 'tamworth', to: 'nuneaton', canalRoute: true, railRoute: true },

  // Nuneaton
  { id: 'nuneaton-coventry', from: 'nuneaton', to: 'coventry', canalRoute: false, railRoute: true },

  // Coventry
  { id: 'coventry-birmingham', from: 'coventry', to: 'birmingham', canalRoute: true, railRoute: true },

  // Dudley
  { id: 'dudley-birmingham', from: 'dudley', to: 'birmingham', canalRoute: true, railRoute: true },
  { id: 'dudley-kidderminster', from: 'dudley', to: 'kidderminster', canalRoute: true, railRoute: true },
  { id: 'dudley-wolverhampton', from: 'dudley', to: 'wolverhampton', canalRoute: true, railRoute: true },

  // Kidderminster–Worcester (farmBrewery2 sits on this trunk; no separate farm links — see TRUNK_ATTACHED_FARM)
  { id: 'kidderminster-worcester', from: 'kidderminster', to: 'worcester', canalRoute: true, railRoute: true },

  // Worcester
  { id: 'worcester-gloucester', from: 'worcester', to: 'gloucester', canalRoute: true, railRoute: true },
  { id: 'worcester-birmingham', from: 'worcester', to: 'birmingham', canalRoute: true, railRoute: true },

  // Gloucester
  { id: 'gloucester-redditch', from: 'gloucester', to: 'redditch', canalRoute: true, railRoute: true },

  // Redditch
  { id: 'redditch-birmingham', from: 'redditch', to: 'birmingham', canalRoute: false, railRoute: true },
  { id: 'redditch-oxford', from: 'redditch', to: 'oxford', canalRoute: true, railRoute: true },

  // Birmingham
  { id: 'birmingham-nuneaton', from: 'birmingham', to: 'nuneaton', canalRoute: false, railRoute: true },
  { id: 'birmingham-oxford', from: 'birmingham', to: 'oxford', canalRoute: true, railRoute: true },
  { id: 'birmingham-tamworth', from: 'birmingham', to: 'tamworth', canalRoute: true, railRoute: true },

]

function getConnectionsForLocation (locationId) {
  return connections.filter(c => c.from === locationId || c.to === locationId)
}

function getAdjacentLocations (locationId) {
  return getConnectionsForLocation(locationId).map(c => c.from === locationId ? c.to : c.from)
}

function getConnectionBetween (locA, locB) {
  return connections.find(
    c => (c.from === locA && c.to === locB) || (c.from === locB && c.to === locA)
  ) || null
}

function getConnectionsForEra (era) {
  if (era === 'canal') return connections.filter(c => c.canalRoute)
  return connections.filter(c => c.railRoute)
}

module.exports = {
  connections,
  TRUNK_ATTACHED_FARM,
  getConnectionsForLocation,
  getAdjacentLocations,
  getConnectionBetween,
  getConnectionsForEra,
}
