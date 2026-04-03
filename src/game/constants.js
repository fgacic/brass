const ERA = {
  CANAL: 'canal',
  RAIL: 'rail',
}

const PHASE = {
  ACTION: 'action',
  END_OF_ROUND: 'endOfRound',
  END_OF_ERA: 'endOfEra',
  GAME_OVER: 'gameOver',
}

const ACTION = {
  BUILD: 'build',
  NETWORK: 'network',
  DEVELOP: 'develop',
  SELL: 'sell',
  LOAN: 'loan',
  SCOUT: 'scout',
  PASS: 'pass',
}

const INDUSTRY = {
  COTTON_MILL: 'cottonMill',
  MANUFACTURER: 'manufacturer',
  COAL_MINE: 'coalMine',
  IRON_WORKS: 'ironWorks',
  BREWERY: 'brewery',
  POTTERY: 'pottery',
}

const RESOURCE = {
  COAL: 'coal',
  IRON: 'iron',
  BEER: 'beer',
}

const LINK_TYPE = {
  CANAL: 'canal',
  RAIL: 'rail',
}

const LOCATION_TYPE = {
  CITY: 'city',
  TOWN: 'town',
  MERCHANT: 'merchant',
  FARM_BREWERY: 'farmBrewery',
}

const PLAYER_COLORS = ['red', 'blue', 'yellow', 'purple']

const ROUNDS_PER_ERA = { 2: 10, 3: 9, 4: 8 }
const STARTING_MONEY = 17
const STARTING_INCOME = 10
const HAND_SIZE = 8
const LOAN_AMOUNT = 30
const LOAN_INCOME_PENALTY = 3
const MIN_INCOME_LEVEL = -10
const CANAL_LINK_COST = 3
const SINGLE_RAIL_COST = 5
const DOUBLE_RAIL_COST = 15
const COAL_MARKET_EMPTY_PRICE = 8
const IRON_MARKET_EMPTY_PRICE = 6
const LINK_TILES_PER_PLAYER = 14

module.exports = {
  ERA, PHASE, ACTION, INDUSTRY, RESOURCE, LINK_TYPE, LOCATION_TYPE,
  PLAYER_COLORS, ROUNDS_PER_ERA, STARTING_MONEY, STARTING_INCOME,
  HAND_SIZE, LOAN_AMOUNT, LOAN_INCOME_PENALTY, MIN_INCOME_LEVEL,
  CANAL_LINK_COST, SINGLE_RAIL_COST, DOUBLE_RAIL_COST,
  COAL_MARKET_EMPTY_PRICE, IRON_MARKET_EMPTY_PRICE, LINK_TILES_PER_PLAYER,
}
