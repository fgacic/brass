const { ACTION } = require('../../constants')
const { executeBuild, validateBuild } = require('./build')
const { executeNetwork, validateNetwork } = require('./network')
const { executeDevelop, validateDevelop } = require('./develop')
const { executeSell, validateSell } = require('./sell')
const { executeLoan, validateLoan } = require('./loan')
const { executeScout, validateScout } = require('./scout')
const { executePass, validatePass } = require('./pass')
const { getCurrentPlayer } = require('../state')

const actionHandlers = {
  [ACTION.BUILD]: { validate: validateBuild, execute: executeBuild },
  [ACTION.NETWORK]: { validate: validateNetwork, execute: executeNetwork },
  [ACTION.DEVELOP]: { validate: validateDevelop, execute: executeDevelop },
  [ACTION.SELL]: { validate: validateSell, execute: executeSell },
  [ACTION.LOAN]: { validate: validateLoan, execute: executeLoan },
  [ACTION.SCOUT]: { validate: validateScout, execute: executeScout },
  [ACTION.PASS]: { validate: validatePass, execute: executePass },
}

function processAction (state, playerId, actionType, payload) {
  const currentPlayer = getCurrentPlayer(state)
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return { state, error: 'Not your turn' }
  }

  const handler = actionHandlers[actionType]
  if (!handler) {
    return { state, error: `Unknown action: ${actionType}` }
  }

  return handler.execute(state, playerId, payload)
}

function getValidActions (state, playerId) {
  const valid = []
  for (const [actionType, handler] of Object.entries(actionHandlers)) {
    // Basic check - detailed validation requires payload
    valid.push(actionType)
  }
  return valid
}

module.exports = { processAction, getValidActions }
