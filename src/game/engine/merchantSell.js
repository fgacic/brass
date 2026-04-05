const { areConnected } = require('./pathfinding')
const { merchantAcceptsIndustry } = require('../data/merchants')

/**
 * Merchant city to sell from `fromLocationId`, among in-play merchants that demand `industry`
 * and are reachable via built links for the current era (same rule as validateSell).
 */
function pickMerchantLocationForSell (boardLinks, era, merchantsMap, fromLocationId, industry) {
  const candidates = []
  for (const [locId, merchant] of Object.entries(merchantsMap || {})) {
    if (!merchantAcceptsIndustry(merchant, industry)) continue
    if (!areConnected(boardLinks, era, fromLocationId, locId)) continue
    candidates.push(locId)
  }
  candidates.sort((a, b) => a.localeCompare(b))
  return candidates[0] ?? null
}

module.exports = { pickMerchantLocationForSell }
