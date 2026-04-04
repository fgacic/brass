const { INDUSTRY } = require('../constants')

const I = INDUSTRY

const merchantTiles = [
  { id: 'merch_1', acceptedIndustries: [I.MANUFACTURER, I.COTTON_MILL], bonus: null },
  { id: 'merch_2', acceptedIndustries: [I.MANUFACTURER, I.COTTON_MILL], bonus: null },
  { id: 'merch_3', acceptedIndustries: [I.POTTERY], bonus: null },
  { id: 'merch_4', acceptedIndustries: [I.MANUFACTURER, I.COTTON_MILL], bonus: null },
  { id: 'merch_5', acceptedIndustries: [I.POTTERY, I.MANUFACTURER], bonus: null },
  { id: 'merch_6', acceptedIndustries: [I.COTTON_MILL], bonus: null },
  { id: 'merch_7', acceptedIndustries: [I.MANUFACTURER], bonus: null },
  { id: 'merch_8', acceptedIndustries: [I.COTTON_MILL, I.MANUFACTURER], bonus: null },
  { id: 'merch_9', acceptedIndustries: [I.POTTERY, I.COTTON_MILL], bonus: null },
]

const merchantLocations = [
  { locationId: 'shrewsbury', minPlayers: 2, bonusType: 'vp', bonusValue: 4 },
  { locationId: 'gloucester', minPlayers: 2, bonusType: 'develop', bonusValue: 1 },
  { locationId: 'oxford', minPlayers: 2, bonusType: 'income', bonusValue: 2 },
  { locationId: 'warrington', minPlayers: 2, bonusType: 'money', bonusValue: 5 },
  { locationId: 'nottingham', minPlayers: 4, bonusType: 'vp', bonusValue: 4 },
]

function getActiveMerchantLocations (playerCount) {
  return merchantLocations.filter(ml => playerCount >= ml.minPlayers)
}

function shuffleArray (arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function setupMerchants (playerCount) {
  const activeLocs = getActiveMerchantLocations(playerCount)
  const shuffledTiles = shuffleArray([...merchantTiles])
  const result = {}

  for (let i = 0; i < activeLocs.length; i++) {
    const loc = activeLocs[i]
    const tileA = shuffledTiles[i * 2]
    const tileB = shuffledTiles[i * 2 + 1]

    result[loc.locationId] = {
      tiles: tileB ? [tileA, tileB] : [tileA],
      bonusType: loc.bonusType,
      bonusValue: loc.bonusValue,
      beerAvailable: true,
    }
  }

  return result
}

module.exports = { merchantTiles, merchantLocations, getActiveMerchantLocations, setupMerchants }
