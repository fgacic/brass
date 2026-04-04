'use client'

const progressTrack = [
  { position: 0, income: -10 }, { position: 1, income: -9 }, { position: 2, income: -8 },
  { position: 3, income: -7 }, { position: 4, income: -6 }, { position: 5, income: -5 },
  { position: 6, income: -4 }, { position: 7, income: -3 }, { position: 8, income: -2 },
  { position: 9, income: -1 }, { position: 10, income: 0 }, { position: 11, income: 0 },
  { position: 12, income: 1 }, { position: 13, income: 1 }, { position: 14, income: 1 },
  { position: 15, income: 2 }, { position: 16, income: 2 }, { position: 17, income: 2 },
  { position: 18, income: 3 }, { position: 19, income: 3 }, { position: 20, income: 3 },
  { position: 21, income: 4 }, { position: 22, income: 4 }, { position: 23, income: 4 },
  { position: 24, income: 5 }, { position: 25, income: 5 }, { position: 26, income: 5 },
  { position: 27, income: 6 }, { position: 28, income: 6 }, { position: 29, income: 6 },
  { position: 30, income: 7 }, { position: 31, income: 7 }, { position: 32, income: 7 },
  { position: 33, income: 8 }, { position: 34, income: 8 }, { position: 35, income: 8 },
  { position: 36, income: 9 }, { position: 37, income: 9 }, { position: 38, income: 10 },
  { position: 39, income: 10 }, { position: 40, income: 11 }, { position: 41, income: 11 },
  { position: 42, income: 12 }, { position: 43, income: 12 }, { position: 44, income: 13 },
  { position: 45, income: 13 }, { position: 46, income: 14 }, { position: 47, income: 14 },
  { position: 48, income: 15 }, { position: 49, income: 15 }, { position: 50, income: 16 },
  { position: 51, income: 16 }, { position: 52, income: 17 }, { position: 53, income: 17 },
  { position: 54, income: 18 }, { position: 55, income: 18 }, { position: 56, income: 19 },
  { position: 57, income: 19 }, { position: 58, income: 20 }, { position: 59, income: 20 },
  { position: 60, income: 21 }, { position: 61, income: 22 }, { position: 62, income: 23 },
  { position: 63, income: 24 }, { position: 64, income: 25 }, { position: 65, income: 26 },
  { position: 66, income: 27 }, { position: 67, income: 28 }, { position: 68, income: 29 },
  { position: 69, income: 30 },
]

function getIncomeAtPosition (position) {
  const clamped = Math.max(0, Math.min(position, progressTrack.length - 1))
  return progressTrack[clamped].income
}

const INDUSTRY_LABELS = {
  cottonMill: 'Cotton Mill',
  manufacturer: 'Manufacturer',
  coalMine: 'Coal Mine',
  ironWorks: 'Iron Works',
  brewery: 'Brewery',
  pottery: 'Pottery',
}

const INDUSTRY_COLORS = {
  cottonMill: 'bg-blue-900/40 border-blue-700',
  manufacturer: 'bg-purple-900/40 border-purple-700',
  coalMine: 'bg-zinc-800/40 border-zinc-600',
  ironWorks: 'bg-orange-900/40 border-orange-700',
  brewery: 'bg-yellow-900/40 border-yellow-700',
  pottery: 'bg-teal-900/40 border-teal-700',
}

export function PlayerMat ({ player }) {
  if (!player) return null

  const income = getIncomeAtPosition(player.incomeMarkerPosition)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-300">Your Mat</h3>
        <div className="flex gap-3 text-xs">
          <span className="text-green-400">£{player.money}</span>
          <span className="text-amber-400">{player.vpMarker} VP</span>
          <span className="text-blue-400">Inc: {income}</span>
          <span className="text-stone-400">{player.linkTilesRemaining} links</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(player.playerMat || {}).map(([industry, tiles]) => (
          <div
            key={industry}
            className={`px-2 py-1.5 rounded border text-xs ${INDUSTRY_COLORS[industry] || 'bg-stone-800 border-stone-700'}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-stone-300 font-medium">
                {INDUSTRY_LABELS[industry] || industry}
              </span>
              <span className="text-stone-400">{tiles.length}</span>
            </div>
            {tiles.length > 0 && (
              <div className="mt-0.5 text-stone-500">
                Next: L{tiles[0].level} (£{tiles[0].cost})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
