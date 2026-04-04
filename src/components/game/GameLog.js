'use client'

const ACTION_LABELS = {
  build: 'built',
  network: 'placed link',
  develop: 'developed',
  sell: 'sold',
  loan: 'took loan',
  scout: 'scouted',
  pass: 'passed',
  gameOver: 'Game Over',
}

export function GameLog ({ log, players }) {
  if (!log || log.length === 0) return null

  const recent = log.slice(-15).reverse()

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-stone-400">Game Log</h3>
      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {recent.map((entry, i) => {
          const player = players.find(p => p.id === entry.playerId)
          const actionLabel = ACTION_LABELS[entry.action] || entry.action

          return (
            <div key={i} className="text-xs text-stone-500">
              <span className="text-stone-300">{player?.name || 'System'}</span>
              {' '}{actionLabel}
              {entry.details?.industry && (
                <span className="text-stone-400">
                  {' '}{entry.details.industry} L{entry.details.level}
                </span>
              )}
              {entry.details?.locationId && (
                <span className="text-stone-400"> at {entry.details.locationId}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
