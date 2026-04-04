const { INDUSTRY, ERA } = require('../constants')

const I = INDUSTRY

const industryDefinitions = {
  [I.COTTON_MILL]: {
    name: 'Cotton Mill',
    tilesPerPlayer: [
      { level: 1, count: 3, cost: 12, coalCost: 0, ironCost: 0, beerCost: 1, vp: 5, incomeSteps: 5, linkVP: 1, canBuildInCanal: true, canBuildInRail: false, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 2, count: 3, cost: 14, coalCost: 0, ironCost: 1, beerCost: 1, vp: 5, incomeSteps: 4, linkVP: 2, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 3, count: 3, cost: 16, coalCost: 1, ironCost: 1, beerCost: 1, vp: 9, incomeSteps: 7, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 4, count: 2, cost: 18, coalCost: 1, ironCost: 1, beerCost: 1, vp: 12, incomeSteps: 8, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
    ],
  },

  [I.MANUFACTURER]: {
    name: 'Manufacturer',
    tilesPerPlayer: [
      { level: 1, count: 2, cost: 8, coalCost: 0, ironCost: 0, beerCost: 1, vp: 3, incomeSteps: 5, linkVP: 2, canBuildInCanal: true, canBuildInRail: false, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 2, count: 1, cost: 10, coalCost: 1, ironCost: 0, beerCost: 0, vp: 5, incomeSteps: 1, linkVP: 2, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 3, count: 2, cost: 12, coalCost: 1, ironCost: 1, beerCost: 0, vp: 4, incomeSteps: 4, linkVP: 0, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 4, count: 1, cost: 8, coalCost: 1, ironCost: 1, beerCost: 0, vp: 3, incomeSteps: 6, linkVP: 0, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 5, count: 2, cost: 16, coalCost: 1, ironCost: 0, beerCost: 2, vp: 8, incomeSteps: 2, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: true, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 6, count: 1, cost: 20, coalCost: 0, ironCost: 0, beerCost: 1, vp: 7, incomeSteps: 6, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: true, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 7, count: 1, cost: 16, coalCost: 1, ironCost: 1, beerCost: 0, vp: 9, incomeSteps: 4, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: true, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 8, count: 1, cost: 20, coalCost: 0, ironCost: 1, beerCost: 1, vp: 11, incomeSteps: 1, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: true, resourceSlots: 0, resourceType: null, flipsOnSell: true },
    ],
  },

  [I.COAL_MINE]: {
    name: 'Coal Mine',
    tilesPerPlayer: [
      { level: 1, count: 1, cost: 5, coalCost: 0, ironCost: 0, beerCost: 0, vp: 1, incomeSteps: 4, linkVP: 2, canBuildInCanal: true, canBuildInRail: false, isLocked: false, resourceSlots: 2, resourceType: 'coal', flipsOnSell: false, flipsOnEmpty: true },
      { level: 2, count: 2, cost: 7, coalCost: 0, ironCost: 0, beerCost: 0, vp: 2, incomeSteps: 7, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 3, resourceType: 'coal', flipsOnSell: false, flipsOnEmpty: true },
      { level: 3, count: 2, cost: 8, coalCost: 0, ironCost: 1, beerCost: 0, vp: 3, incomeSteps: 6, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 4, resourceType: 'coal', flipsOnSell: false, flipsOnEmpty: true },
      { level: 4, count: 2, cost: 10, coalCost: 0, ironCost: 1, beerCost: 0, vp: 4, incomeSteps: 5, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 5, resourceType: 'coal', flipsOnSell: false, flipsOnEmpty: true },
    ],
  },

  [I.IRON_WORKS]: {
    name: 'Iron Works',
    tilesPerPlayer: [
      { level: 1, count: 1, cost: 5, coalCost: 1, ironCost: 0, beerCost: 0, vp: 3, incomeSteps: 3, linkVP: 1, canBuildInCanal: true, canBuildInRail: false, isLocked: false, resourceSlots: 4, resourceType: 'iron', flipsOnSell: false, flipsOnEmpty: true },
      { level: 2, count: 1, cost: 7, coalCost: 1, ironCost: 0, beerCost: 0, vp: 5, incomeSteps: 3, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 4, resourceType: 'iron', flipsOnSell: false, flipsOnEmpty: true },
      { level: 3, count: 1, cost: 9, coalCost: 1, ironCost: 0, beerCost: 0, vp: 7, incomeSteps: 2, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 5, resourceType: 'iron', flipsOnSell: false, flipsOnEmpty: true },
      { level: 4, count: 1, cost: 12, coalCost: 1, ironCost: 0, beerCost: 0, vp: 9, incomeSteps: 1, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 6, resourceType: 'iron', flipsOnSell: false, flipsOnEmpty: true },
    ],
  },

  [I.BREWERY]: {
    name: 'Brewery',
    tilesPerPlayer: [
      { level: 1, count: 2, cost: 5, coalCost: 0, ironCost: 1, beerCost: 0, vp: 4, incomeSteps: 4, linkVP: 2, canBuildInCanal: true, canBuildInRail: false, isLocked: false, resourceSlots: 1, resourceType: 'beer', flipsOnSell: false, flipsOnEmpty: true, beerSlotsCanal: 1, beerSlotsRail: 2 },
      { level: 2, count: 2, cost: 7, coalCost: 0, ironCost: 1, beerCost: 0, vp: 5, incomeSteps: 5, linkVP: 2, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 1, resourceType: 'beer', flipsOnSell: false, flipsOnEmpty: true, beerSlotsCanal: 1, beerSlotsRail: 2 },
      { level: 3, count: 2, cost: 9, coalCost: 0, ironCost: 1, beerCost: 0, vp: 7, incomeSteps: 5, linkVP: 2, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 1, resourceType: 'beer', flipsOnSell: false, flipsOnEmpty: true, beerSlotsCanal: 1, beerSlotsRail: 2 },
      { level: 4, count: 1, cost: 9, coalCost: 0, ironCost: 1, beerCost: 0, vp: 10, incomeSteps: 5, linkVP: 2, canBuildInCanal: true, canBuildInRail: true, isLocked: true, resourceSlots: 1, resourceType: 'beer', flipsOnSell: false, flipsOnEmpty: true, beerSlotsCanal: 1, beerSlotsRail: 2 },
    ],
  },

  [I.POTTERY]: {
    name: 'Pottery',
    tilesPerPlayer: [
      { level: 1, count: 1, cost: 17, coalCost: 0, ironCost: 1, beerCost: 1, vp: 10, incomeSteps: 5, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, hasLightbulb: true, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 2, count: 1, cost: 0, coalCost: 1, ironCost: 0, beerCost: 1, vp: 1, incomeSteps: 1, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, hasLightbulb: true, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 3, count: 1, cost: 22, coalCost: 2, ironCost: 0, beerCost: 2, vp: 11, incomeSteps: 5, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 4, count: 1, cost: 0, coalCost: 1, ironCost: 0, beerCost: 1, vp: 1, incomeSteps: 1, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
      { level: 5, count: 1, cost: 24, coalCost: 2, ironCost: 0, beerCost: 2, vp: 20, incomeSteps: 5, linkVP: 1, canBuildInCanal: true, canBuildInRail: true, isLocked: false, resourceSlots: 0, resourceType: null, flipsOnSell: true },
    ],
  },
}

function getTileDefinition (industry, level) {
  const def = industryDefinitions[industry]
  if (!def) return null
  return def.tilesPerPlayer.find(t => t.level === level) || null
}

function generatePlayerTiles (playerId) {
  const tiles = []
  let tileIndex = 0
  for (const [industry, def] of Object.entries(industryDefinitions)) {
    for (const levelDef of def.tilesPerPlayer) {
      for (let i = 0; i < levelDef.count; i++) {
        tiles.push({
          id: `${playerId}_${industry}_${levelDef.level}_${i}`,
          industry,
          level: levelDef.level,
          ...levelDef,
        })
        tileIndex++
      }
    }
  }
  return tiles
}

function getLowestUnbuiltTile (playerMat, industry) {
  const stack = playerMat[industry]
  if (!stack || stack.length === 0) return null
  return stack[0]
}

module.exports = {
  industryDefinitions,
  getTileDefinition,
  generatePlayerTiles,
  getLowestUnbuiltTile,
}
