const { INDUSTRY } = require('../constants')

/** Industries that use merchant cities: each active merchant rolls 0–2 of these at setup. */
const MERCHANT_DEMAND_INDUSTRIES = [
  INDUSTRY.COTTON_MILL,
  INDUSTRY.MANUFACTURER,
  INDUSTRY.POTTERY,
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

/** 0, 1, or 2 distinct industries from MERCHANT_DEMAND_INDUSTRIES. */
function rollAcceptedIndustries () {
  const count = Math.floor(Math.random() * 3)
  return shuffleArray([...MERCHANT_DEMAND_INDUSTRIES]).slice(0, count)
}

function setupMerchants (playerCount) {
  const activeLocs = getActiveMerchantLocations(playerCount)
  const result = {}

  for (const loc of activeLocs) {
    result[loc.locationId] = {
      acceptedIndustries: rollAcceptedIndustries(),
      bonusType: loc.bonusType,
      bonusValue: loc.bonusValue,
      beerAvailable: true,
    }
  }

  return result
}

module.exports = {
  MERCHANT_DEMAND_INDUSTRIES,
  merchantLocations,
  getActiveMerchantLocations,
  setupMerchants,
}
