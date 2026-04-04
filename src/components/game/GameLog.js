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
    <div className="space-y-2 rounded-xl border border-amber-900/20 bg-[#0f0c0a]/40 p-3 shadow-inner">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-amber-200/40">Log</h3>
      <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
        {recent.map((entry, i) => {
          const player = players.find(p => p.id === entry.playerId)
          const actionLabel = ACTION_LABELS[entry.action] || entry.action

          return (
            <div key={i} className="text-xs leading-snug text-stone-500">
              <span className="font-medium text-[#d8d0c4]">{player?.name || 'System'}</span>
              {' '}{actionLabel}
              {entry.details?.industry && (
                <span className="text-amber-100/35">
                  {' '}{entry.details.industry} L{entry.details.level}
                </span>
              )}
              {entry.details?.locationId && (
                <span className="text-amber-100/30"> at {entry.details.locationId}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
