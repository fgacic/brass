function snapshotPlayerMoney (gameState) {
  if (!gameState?.players) return {}
  const m = {}
  for (const p of gameState.players) {
    m[p.id] = p.money
  }
  return m
}

function logMoneyAfterAction ({ roomId, actionType, actorId, beforeMoney, afterState }) {
  if (!afterState?.players) return
  const parts = afterState.players.map((p) => {
    const prev = beforeMoney[p.id]
    const cur = p.money
    const delta = prev !== undefined ? cur - prev : 0
    const nm = (p.name && String(p.name).slice(0, 16)) || p.id.slice(-8)
    if (delta === 0) return `${nm}:£${cur}`
    const sign = delta > 0 ? '+' : ''
    return `${nm}:£${cur}(Δ${sign}${delta})`
  })
  const actorShort = typeof actorId === 'string' ? actorId.slice(-10) : actorId
  console.log(`[Money] room=${roomId} action=${actionType} actor=${actorShort} | ${parts.join(' · ')}`)
}

function logMoneyStatus ({ roomId, label, gameState }) {
  if (!gameState?.players) return
  const parts = gameState.players.map((p) => {
    const nm = (p.name && String(p.name).slice(0, 16)) || p.id.slice(-8)
    return `${nm}:£${p.money}`
  })
  console.log(`[Money] room=${roomId} ${label} | ${parts.join(' · ')}`)
}

function logMoneyCalc (tag, payload) {
  try {
    console.log(`[MoneyCalc] ${tag}`, JSON.stringify(payload))
  } catch {
    console.log(`[MoneyCalc] ${tag}`, payload)
  }
}

module.exports = {
  snapshotPlayerMoney,
  logMoneyAfterAction,
  logMoneyStatus,
  logMoneyCalc,
}
