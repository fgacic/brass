const { INDUSTRY } = require('../constants')

const I = INDUSTRY

/** Cotton / manufacturer / pottery — the only industries sold at merchant cities. */
const MERCHANT_DEMAND_INDUSTRIES = [I.COTTON_MILL, I.MANUFACTURER, I.POTTERY]

/**
 * Fixed deck: 6 non-empty demand cards + 3 empty (empties are not placed on the board).
 * All six non-empty cards are always assigned across active merchant cities (some cities
 * get two demand strips when fewer than six merchants are in play).
 */
function buildMerchantDemandDeck () {
  return [
    { acceptedIndustries: [I.MANUFACTURER] },
    { acceptedIndustries: [I.MANUFACTURER] },
    { acceptedIndustries: [I.POTTERY] },
    { acceptedIndustries: [I.COTTON_MILL] },
    { acceptedIndustries: [I.COTTON_MILL] },
    { acceptedIndustries: [I.COTTON_MILL, I.MANUFACTURER, I.POTTERY] },
    { acceptedIndustries: [] },
    { acceptedIndustries: [] },
    { acceptedIndustries: [] },
  ].map((card) => ({ acceptedIndustries: [...card.acceptedIndustries] }))
}

function getNonEmptyCards (deck) {
  return deck.filter((c) => (c.acceptedIndustries || []).length > 0)
}

const SHREWSBURY_ID = 'shrewsbury'

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

/** Shrewsbury: at most one sell industry (board rule); coal is separate game logic. */
function capShrewsburyDemand (acceptedIndustries) {
  if (acceptedIndustries.length <= 1) return acceptedIndustries
  const pick = acceptedIndustries[Math.floor(Math.random() * acceptedIndustries.length)]
  return [pick]
}

function acceptsAllThreeMerchantIndustries (acceptedIndustries) {
  const acc = acceptedIndustries || []
  if (acc.length !== 3) return false
  const set = new Set(acc)
  return MERCHANT_DEMAND_INDUSTRIES.every((ind) => set.has(ind))
}

/** Beer barrels for one demand strip (triple card = one barrel). */
function getSlotBeerCapacity (acceptedIndustries) {
  const acc = acceptedIndustries || []
  if (acc.length === 0) return 0
  if (acceptsAllThreeMerchantIndustries(acc)) return 1
  return acc.length
}

/**
 * Places every non-empty card on some merchant. Shrewsbury never gets more than one strip.
 * Round-robin with skip when Shrewsbury already has a strip.
 */
function distributeDemandCards (activeLocs, cards) {
  const slotCountByLoc = Object.fromEntries(activeLocs.map((l) => [l.locationId, 0]))
  const assignments = []
  let mi = 0

  for (const card of cards) {
    let placed = false
    let attempts = 0
    const maxAttempts = activeLocs.length * 3

    while (!placed && attempts < maxAttempts) {
      const loc = activeLocs[mi % activeLocs.length]
      const id = loc.locationId
      const maxSlots = id === SHREWSBURY_ID ? 1 : 999
      if (slotCountByLoc[id] < maxSlots) {
        let acc = [...(card.acceptedIndustries || [])]
        if (id === SHREWSBURY_ID) acc = capShrewsburyDemand(acc)
        assignments.push({ locationId: id, acceptedIndustries: acc })
        slotCountByLoc[id]++
        placed = true
      }
      mi++
      attempts++
    }
  }

  return assignments
}

function merchantAcceptsIndustry (merchant, industry) {
  if (merchant.demandSlots?.length) {
    return merchant.demandSlots.some((s) => (s.acceptedIndustries || []).includes(industry))
  }
  return (merchant.acceptedIndustries || []).includes(industry)
}

/** Total barrels remaining at a merchant (all strips). */
function getTotalMerchantBeerRemaining (merchant) {
  if (merchant.demandSlots?.length) {
    return merchant.demandSlots.reduce((a, s) => a + (s.merchantBeerRemaining || 0), 0)
  }
  return merchant.merchantBeerRemaining || 0
}

/**
 * @deprecated prefer getSlotBeerCapacity per slot; kept for legacy single-strip merchants
 */
function getMerchantBeerCapacity (merchant) {
  if (merchant.demandSlots?.length) {
    return merchant.demandSlots.reduce(
      (sum, s) => sum + getSlotBeerCapacity(s.acceptedIndustries),
      0
    )
  }
  return getSlotBeerCapacity(merchant.acceptedIndustries || [])
}

function refillMerchantBeer (merchant) {
  if (merchant.demandSlots?.length) {
    for (const slot of merchant.demandSlots) {
      slot.merchantBeerRemaining = getSlotBeerCapacity(slot.acceptedIndustries)
    }
  } else {
    merchant.merchantBeerRemaining = getSlotBeerCapacity(merchant.acceptedIndustries || [])
  }
}

function setupMerchants (playerCount) {
  const activeLocs = getActiveMerchantLocations(playerCount)
  const deck = buildMerchantDemandDeck()
  const nonEmpty = shuffleArray(getNonEmptyCards(deck))
  const assignments = distributeDemandCards(activeLocs, nonEmpty)
  const result = {}

  for (const loc of activeLocs) {
    const strips = assignments.filter((a) => a.locationId === loc.locationId)
    const demandSlots = strips.map((a) => ({
      acceptedIndustries: a.acceptedIndustries,
      merchantBeerRemaining: getSlotBeerCapacity(a.acceptedIndustries),
    }))
    result[loc.locationId] = {
      demandSlots,
      bonusType: loc.bonusType,
      bonusValue: loc.bonusValue,
    }
  }

  return result
}

module.exports = {
  MERCHANT_DEMAND_INDUSTRIES,
  merchantLocations,
  getActiveMerchantLocations,
  getMerchantBeerCapacity,
  getSlotBeerCapacity,
  merchantAcceptsIndustry,
  getTotalMerchantBeerRemaining,
  refillMerchantBeer,
  setupMerchants,
}
