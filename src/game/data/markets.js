const coalMarketSpaces = [
  { price: 1, count: 2 },
  { price: 2, count: 2 },
  { price: 3, count: 2 },
  { price: 4, count: 2 },
  { price: 5, count: 2 },
  { price: 6, count: 2 },
  { price: 7, count: 1 },
  { price: 8, count: 1 },
]

const ironMarketSpaces = [
  { price: 1, count: 2 },
  { price: 2, count: 2 },
  { price: 3, count: 2 },
  { price: 4, count: 2 },
  { price: 5, count: 2 },
  { price: 6, count: 2 },
]

function createCoalMarket () {
  const spaces = []
  for (const { price, count } of coalMarketSpaces) {
    for (let i = 0; i < count; i++) {
      spaces.push({ price, filled: false })
    }
  }
  // Initially all filled except cheapest space
  for (let i = 1; i < spaces.length; i++) {
    spaces[i].filled = true
  }
  return spaces
}

function createIronMarket () {
  const spaces = []
  for (const { price, count } of ironMarketSpaces) {
    for (let i = 0; i < count; i++) {
      spaces.push({ price, filled: false })
    }
  }
  // Initially all filled except two cheapest spaces
  for (let i = 2; i < spaces.length; i++) {
    spaces[i].filled = true
  }
  return spaces
}

function getCoalPrice (market) {
  for (const space of market) {
    if (space.filled) return space.price
  }
  return 8
}

function getIronPrice (market) {
  for (const space of market) {
    if (space.filled) return space.price
  }
  return 6
}

/** Buy from demand: take the cheapest available cube (array is low price → high price). */
function removeFromMarket (market) {
  for (let i = 0; i < market.length; i++) {
    if (market[i].filled) {
      market[i].filled = false
      return market[i].price
    }
  }
  return null
}

function addToMarket (market) {
  for (let i = 0; i < market.length; i++) {
    if (!market[i].filled) {
      market[i].filled = true
      return market[i].price
    }
  }
  return null
}

function countCubesInMarket (market) {
  return market.filter(s => s.filled).length
}

module.exports = {
  createCoalMarket, createIronMarket,
  getCoalPrice, getIronPrice,
  removeFromMarket, addToMarket, countCubesInMarket,
}
