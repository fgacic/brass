const { ERA, PHASE } = require('../constants')
const { connections } = require('../data/board-connections')
const { locations } = require('../data/locations')
const { deepClone } = require('./state')
const { transitionToRailEra } = require('./turn')

function scoreLinkTiles (state) {
  for (const player of state.players) {
    let linkVP = 0

    for (const conn of connections) {
      const link = state.board.links[conn.id]
      if (!link || link.ownerId !== player.id) continue

      const fromLoc = locations[conn.from]
      const toLoc = locations[conn.to]

      let fromVP = fromLoc ? fromLoc.linkVP : 0
      let toVP = toLoc ? toLoc.linkVP : 0

      const fromTiles = state.industryTilesOnBoard.filter(
        t => t.locationId === conn.from && t.isFlipped
      )
      for (const t of fromTiles) {
        fromVP += (t.linkVP || 0)
      }

      const toTiles = state.industryTilesOnBoard.filter(
        t => t.locationId === conn.to && t.isFlipped
      )
      for (const t of toTiles) {
        toVP += (t.linkVP || 0)
      }

      linkVP += fromVP + toVP
    }

    player.vpMarker += linkVP
  }
}

function scoreFlippedIndustries (state) {
  for (const player of state.players) {
    let industryVP = 0

    for (const tile of state.industryTilesOnBoard) {
      if (tile.ownerId === player.id && tile.isFlipped) {
        industryVP += tile.vp
      }
    }

    player.vpMarker += industryVP
  }
}

function processEndOfEra (state) {
  const newState = deepClone(state)

  scoreLinkTiles(newState)
  scoreFlippedIndustries(newState)

  if (newState.era === ERA.CANAL) {
    return transitionToRailEra(newState)
  }

  // End of rail era = game over
  newState.phase = PHASE.GAME_OVER

  const rankings = [...newState.players].sort((a, b) => {
    if (b.vpMarker !== a.vpMarker) return b.vpMarker - a.vpMarker
    const aIncome = require('../data/progress-track').getIncomeAtPosition(a.incomeMarkerPosition)
    const bIncome = require('../data/progress-track').getIncomeAtPosition(b.incomeMarkerPosition)
    if (bIncome !== aIncome) return bIncome - aIncome
    return b.money - a.money
  })

  newState.rankings = rankings.map((p, i) => ({
    playerId: p.id,
    rank: i + 1,
    vp: p.vpMarker,
    name: p.name,
  }))

  newState.log.push({
    action: 'gameOver',
    playerId: null,
    details: { winner: rankings[0].id, rankings: newState.rankings },
    timestamp: Date.now(),
  })

  return newState
}

module.exports = { scoreLinkTiles, scoreFlippedIndustries, processEndOfEra }
