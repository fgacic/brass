const { ERA, PHASE, STARTING_MONEY, STARTING_INCOME, HAND_SIZE, PLAYER_COLORS, LINK_TILES_PER_PLAYER } = require('../constants')
const { locations } = require('../data/locations')
const { connections } = require('../data/board-connections')
const { industryDefinitions } = require('../data/industries')
const { generateDeck, shuffleDeck, createWildCards } = require('../data/cards')
const { createCoalMarket, createIronMarket } = require('../data/markets')
const { setupMerchants } = require('../data/merchants')

function createInitialState (roomId, players) {
  const playerCount = players.length
  const deck = shuffleDeck(generateDeck(playerCount))
  const wilds = createWildCards()

  const boardLocations = {}
  for (const [id, loc] of Object.entries(locations)) {
    if (loc.type === 'merchant') continue
    boardLocations[id] = {
      slots: loc.industrySlots.map(s => ({ tileId: null, ownerId: null, allowedIndustries: s.allowedIndustries })),
    }
  }

  const boardLinks = {}
  for (const conn of connections) {
    boardLinks[conn.id] = { ownerId: null, type: null }
  }

  const gamePlayers = players.map((p, i) => {
    const playerMat = {}
    for (const [industry, def] of Object.entries(industryDefinitions)) {
      const tiles = []
      for (const levelDef of def.tilesPerPlayer) {
        for (let c = 0; c < levelDef.count; c++) {
          tiles.push({
            id: `${p.id}_${industry}_L${levelDef.level}_${c}`,
            industry,
            level: levelDef.level,
            ...levelDef,
          })
        }
      }
      playerMat[industry] = tiles
    }

    const hand = deck.splice(0, HAND_SIZE)
    const firstDiscard = deck.splice(0, 1)

    return {
      id: p.id,
      name: p.name,
      color: PLAYER_COLORS[i],
      money: STARTING_MONEY,
      vpMarker: 0,
      incomeMarkerPosition: STARTING_INCOME,
      hand,
      discardPile: firstDiscard,
      playerMat,
      linkTilesRemaining: LINK_TILES_PER_PLAYER,
      moneySpentThisRound: 0,
      actionsRemaining: 1,
    }
  })

  const turnOrder = gamePlayers.map(p => p.id)
  shuffleArray(turnOrder)

  return {
    id: roomId,
    era: ERA.CANAL,
    round: 1,
    phase: PHASE.ACTION,
    playerCount,
    players: gamePlayers,
    board: {
      locations: boardLocations,
      links: boardLinks,
      merchants: setupMerchants(playerCount),
    },
    industryTilesOnBoard: [],
    coalMarket: createCoalMarket(),
    ironMarket: createIronMarket(),
    turnOrder,
    currentPlayerIndex: 0,
    drawDeck: deck,
    wildCards: wilds,
    log: [],
  }
}

function shuffleArray (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getCurrentPlayer (state) {
  return state.players.find(p => p.id === state.turnOrder[state.currentPlayerIndex])
}

function getPlayerById (state, playerId) {
  return state.players.find(p => p.id === playerId)
}

function deepClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = {
  createInitialState,
  getCurrentPlayer,
  getPlayerById,
  deepClone,
}
