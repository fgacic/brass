const { INDUSTRY } = require('../constants')
const { locations } = require('./locations')

function generateDeck (playerCount) {
  const cards = []
  let cardIndex = 0

  const buildableLocations = Object.values(locations).filter(
    l => l.type !== 'merchant' && l.type !== 'farmBrewery'
  )

  for (const loc of buildableLocations) {
    if (loc.minPlayers > playerCount) continue
    const copies = loc.id === 'birmingham' ? 3
      : ['wolverhampton', 'coventry', 'stokeOnTrent'].includes(loc.id) ? 2
        : 1
    for (let i = 0; i < copies; i++) {
      cards.push({
        id: `loc_${loc.id}_${i}`,
        type: 'location',
        locationId: loc.id,
        locationName: loc.name,
      })
      cardIndex++
    }
  }

  const industryCards = [
    { industry: INDUSTRY.COTTON_MILL, count: 8 },
    { industry: INDUSTRY.MANUFACTURER, count: 8 },
    { industry: INDUSTRY.COAL_MINE, count: 2 },
    { industry: INDUSTRY.IRON_WORKS, count: 2 },
    { industry: INDUSTRY.BREWERY, count: 5 },
    { industry: INDUSTRY.POTTERY, count: 2 },
  ]

  for (const { industry, count } of industryCards) {
    for (let i = 0; i < count; i++) {
      cards.push({
        id: `ind_${industry}_${i}`,
        type: 'industry',
        industry,
      })
      cardIndex++
    }
  }

  return cards
}

function createWildCards () {
  return {
    wildLocation: { id: 'wild_location', type: 'wildLocation' },
    wildIndustry: { id: 'wild_industry', type: 'wildIndustry' },
  }
}

function shuffleDeck (deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

module.exports = { generateDeck, createWildCards, shuffleDeck }
