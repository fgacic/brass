const { INDUSTRY, LOCATION_TYPE } = require('../constants')

const I = INDUSTRY

const locations = {
  // === CITIES (2 link VP) ===
  birmingham: {
    id: 'birmingham',
    name: 'Birmingham',
    type: LOCATION_TYPE.CITY,
    linkVP: 2,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.MANUFACTURER] },
      { allowedIndustries: [I.MANUFACTURER] },
      { allowedIndustries: [I.IRON_WORKS] },
      { allowedIndustries: [I.MANUFACTURER] },
    ],
  },
  coventry: {
    id: 'coventry',
    name: 'Coventry',
    type: LOCATION_TYPE.CITY,
    linkVP: 2,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.POTTERY, I.MANUFACTURER] },
      { allowedIndustries: [I.COAL_MINE, I.IRON_WORKS] },
      { allowedIndustries: [I.MANUFACTURER] },
    ],
  },
  derby: {
    id: 'derby',
    name: 'Derby',
    type: LOCATION_TYPE.CITY,
    linkVP: 2,
    minPlayers: 3,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.BREWERY] },
      { allowedIndustries: [I.COTTON_MILL, I.MANUFACTURER] },
      { allowedIndustries: [I.IRON_WORKS] },
    ],
  },
  nottingham: {
    id: 'nottingham',
    name: 'Nottingham',
    type: LOCATION_TYPE.MERCHANT,
    linkVP: 0,
    minPlayers: 2,
    industrySlots: [],
    hasCoalConnection: true,
  },
  stokeOnTrent: {
    id: 'stokeOnTrent',
    name: 'Stoke-on-Trent',
    type: LOCATION_TYPE.CITY,
    linkVP: 2,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.POTTERY, I.MANUFACTURER] },
      { allowedIndustries: [I.COTTON_MILL, I.IRON_WORKS] },
      { allowedIndustries: [I.MANUFACTURER] },
    ],
  },
  wolverhampton: {
    id: 'wolverhampton',
    name: 'Wolverhampton',
    type: LOCATION_TYPE.CITY,
    linkVP: 2,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.MANUFACTURER] },
      { allowedIndustries: [I.COAL_MINE, I.MANUFACTURER] },
    ],
  },

  // === TOWNS (1 link VP) ===
  belper: {
    id: 'belper',
    name: 'Belper',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.MANUFACTURER] },
      { allowedIndustries: [I.COAL_MINE, I.POTTERY] },
    ],
  },
  burtonOnTrent: {
    id: 'burtonOnTrent',
    name: 'Burton-on-Trent',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.BREWERY, I.MANUFACTURER] },
      { allowedIndustries: [I.COAL_MINE, I.BREWERY] },
    ],
  },
  cannock: {
    id: 'cannock',
    name: 'Cannock',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COAL_MINE, I.MANUFACTURER] },
      { allowedIndustries: [I.COAL_MINE] },
    ],
  },
  coalbrookdale: {
    id: 'coalbrookdale',
    name: 'Coalbrookdale',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.IRON_WORKS] },
      { allowedIndustries: [I.IRON_WORKS, I.BREWERY] },
      { allowedIndustries: [I.COAL_MINE] },
    ],
  },
  dudley: {
    id: 'dudley',
    name: 'Dudley',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COAL_MINE] },
      { allowedIndustries: [I.IRON_WORKS] },
    ],
  },
  kidderminster: {
    id: 'kidderminster',
    name: 'Kidderminster',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.COAL_MINE] },
      { allowedIndustries: [I.COTTON_MILL] },
    ],
  },
  leek: {
    id: 'leek',
    name: 'Leek',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 3,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.MANUFACTURER] },
      { allowedIndustries: [I.COTTON_MILL, I.COAL_MINE] },
    ],
  },
  nuneaton: {
    id: 'nuneaton',
    name: 'Nuneaton',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 3,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.BREWERY] },
      { allowedIndustries: [I.COAL_MINE, I.MANUFACTURER] },
    ],
  },
  redditch: {
    id: 'redditch',
    name: 'Redditch',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COAL_MINE, I.MANUFACTURER] },
      { allowedIndustries: [I.IRON_WORKS] },
    ],
  },
  stafford: {
    id: 'stafford',
    name: 'Stafford',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.POTTERY, I.MANUFACTURER] },
      { allowedIndustries: [I.BREWERY] },
    ],
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 3,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.BREWERY] },
      { allowedIndustries: [I.COTTON_MILL, I.MANUFACTURER] },
    ],
  },
  tamworth: {
    id: 'tamworth',
    name: 'Tamworth',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.COAL_MINE] },
      { allowedIndustries: [I.COTTON_MILL, I.COAL_MINE] },
    ],
  },
  uttoxeter: {
    id: 'uttoxeter',
    name: 'Uttoxeter',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL, I.BREWERY] },
      { allowedIndustries: [I.MANUFACTURER, I.BREWERY] },
    ],
  },
  walsall: {
    id: 'walsall',
    name: 'Walsall',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.BRASS, I.MANUFACTURER] },
      { allowedIndustries: [I.IRON_WORKS, I.MANUFACTURER] },
    ],
  },
  worcester: {
    id: 'worcester',
    name: 'Worcester',
    type: LOCATION_TYPE.TOWN,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.COTTON_MILL] },
      { allowedIndustries: [I.COTTON_MILL] },
    ],
  },

  // === FARM BREWERIES ===
  farmBrewery1: {
    id: 'farmBrewery1',
    name: 'Farm Brewery (Cannock)',
    type: LOCATION_TYPE.FARM_BREWERY,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.BREWERY] },
    ],
  },
  farmBrewery2: {
    id: 'farmBrewery2',
    name: 'Farm Brewery (Kidderminster)',
    type: LOCATION_TYPE.FARM_BREWERY,
    linkVP: 1,
    minPlayers: 2,
    industrySlots: [
      { allowedIndustries: [I.BREWERY] },
    ],
  },

  // === MERCHANT LOCATIONS ===
  shrewsbury: {
    id: 'shrewsbury',
    name: 'Shrewsbury',
    type: LOCATION_TYPE.MERCHANT,
    linkVP: 0,
    minPlayers: 2,
    industrySlots: [],
    hasCoalConnection: true,
  },
  gloucester: {
    id: 'gloucester',
    name: 'Gloucester',
    type: LOCATION_TYPE.MERCHANT,
    linkVP: 0,
    minPlayers: 2,
    industrySlots: [],
    hasCoalConnection: true,
  },
  oxford: {
    id: 'oxford',
    name: 'Oxford',
    type: LOCATION_TYPE.MERCHANT,
    linkVP: 0,
    minPlayers: 2,
    industrySlots: [],
    hasCoalConnection: true,
  },
  warrington: {
    id: 'warrington',
    name: 'Warrington',
    type: LOCATION_TYPE.MERCHANT,
    linkVP: 0,
    minPlayers: 2,
    industrySlots: [],
    hasCoalConnection: true,
  },
}

// Fix walsall - BRASS is not an industry, should be COTTON_MILL
locations.walsall.industrySlots[0] = { allowedIndustries: [I.COTTON_MILL, I.MANUFACTURER] }

function getBuildableLocations () {
  return Object.values(locations).filter(
    l => l.type !== LOCATION_TYPE.MERCHANT
  )
}

function getLocationById (id) {
  return locations[id] || null
}

module.exports = { locations, getBuildableLocations, getLocationById }
