const { ERA, PHASE, HAND_SIZE } = require('../constants')
const { getCurrentPlayer, deepClone } = require('./state')
const { generateDeck, shuffleDeck } = require('../data/cards')
const { getIncomeAtPosition } = require('../data/progress-track')
const { refillMerchantBeer } = require('../data/merchants')

function advanceTurn (state) {
  const newState = deepClone(state)
  const currentPlayer = getCurrentPlayer(newState)
  currentPlayer.actionsRemaining--

  if (currentPlayer.actionsRemaining <= 0) {
    newState.currentPlayerIndex++

    if (newState.currentPlayerIndex >= newState.turnOrder.length) {
      return endRound(newState)
    }
  }

  return newState
}

function endRound (state) {
  const newState = deepClone(state)

  const isLastRound = newState.drawDeck.length === 0 &&
    newState.players.every(p => p.hand.length === 0)

  if (isLastRound) {
    newState.phase = PHASE.END_OF_ERA
    return newState
  }

  reorderTurnOrder(newState)
  collectIncome(newState)
  drawCards(newState)

  newState.round++
  newState.currentPlayerIndex = 0

  for (const p of newState.players) {
    p.moneySpentThisRound = 0
    p.actionsRemaining = 2
  }

  return newState
}

function reorderTurnOrder (state) {
  const players = state.players
  const currentOrder = [...state.turnOrder]

  currentOrder.sort((aId, bId) => {
    const a = players.find(p => p.id === aId)
    const b = players.find(p => p.id === bId)
    if (a.moneySpentThisRound !== b.moneySpentThisRound) {
      return a.moneySpentThisRound - b.moneySpentThisRound
    }
    return state.turnOrder.indexOf(aId) - state.turnOrder.indexOf(bId)
  })

  state.turnOrder = currentOrder
}

function collectIncome (state) {
  const isLastRoundOfGame = state.era === ERA.RAIL &&
    state.drawDeck.length === 0 &&
    state.players.every(p => p.hand.length === 0)

  if (isLastRoundOfGame) return

  for (const player of state.players) {
    const income = getIncomeAtPosition(player.incomeMarkerPosition)
    if (income >= 0) {
      player.money += income
    } else {
      player.money += income
      if (player.money < 0) {
        player.money = 0
      }
    }
  }
}

function drawCards (state) {
  for (const player of state.players) {
    while (player.hand.length < HAND_SIZE && state.drawDeck.length > 0) {
      player.hand.push(state.drawDeck.pop())
    }
  }
}

function transitionToRailEra (state) {
  const newState = deepClone(state)

  // Remove level 1 tiles from board
  newState.industryTilesOnBoard = newState.industryTilesOnBoard.filter(tile => {
    if (tile.level === 1) {
      const loc = newState.board.locations[tile.locationId]
      if (loc) {
        const slot = loc.slots[tile.slotIndex]
        if (slot) {
          slot.tileId = null
          slot.ownerId = null
        }
      }
      return false
    }
    return true
  })

  // Remove all canal links
  for (const [connId, link] of Object.entries(newState.board.links)) {
    if (link.ownerId !== null) {
      link.ownerId = null
      link.type = null
    }
  }

  for (const merchant of Object.values(newState.board.merchants)) {
    refillMerchantBeer(merchant)
  }

  // Reshuffle all cards into new deck
  const allCards = []
  for (const player of newState.players) {
    allCards.push(...player.discardPile)
    player.discardPile = []
    allCards.push(...player.hand)
    player.hand = []
  }
  allCards.push(...newState.drawDeck)

  const newDeck = shuffleDeck(allCards)
  newState.drawDeck = newDeck

  // Deal new hands
  for (const player of newState.players) {
    player.hand = newState.drawDeck.splice(0, HAND_SIZE)
    player.discardPile = [newState.drawDeck.splice(0, 1)[0]]
  }

  newState.era = ERA.RAIL
  newState.round = 1
  newState.phase = PHASE.ACTION
  newState.currentPlayerIndex = 0

  reorderTurnOrder(newState)

  for (const p of newState.players) {
    p.moneySpentThisRound = 0
    p.actionsRemaining = 2
  }

  return newState
}

module.exports = {
  advanceTurn,
  endRound,
  reorderTurnOrder,
  collectIncome,
  drawCards,
  transitionToRailEra,
}
