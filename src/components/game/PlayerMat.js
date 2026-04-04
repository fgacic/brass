'use client'

import { m, LayoutGroup, useReducedMotion } from './motionConfig'

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
  cottonMill: 'border-blue-500/45 bg-gradient-to-br from-blue-600/35 to-blue-950/50 shadow-sm',
  manufacturer: 'border-violet-500/45 bg-gradient-to-br from-violet-600/35 to-violet-950/50 shadow-sm',
  coalMine: 'border-zinc-500/40 bg-gradient-to-br from-zinc-600/30 to-zinc-950/55 shadow-sm',
  ironWorks: 'border-orange-500/45 bg-gradient-to-br from-orange-600/35 to-orange-950/50 shadow-sm',
  brewery: 'border-amber-500/45 bg-gradient-to-br from-amber-600/35 to-amber-950/50 shadow-sm',
  pottery: 'border-teal-500/45 bg-gradient-to-br from-teal-600/35 to-teal-950/50 shadow-sm',
}

export function PlayerMat ({ player, matFlashIndustry, moneyPulseLoan }) {
  const reduceMotion = useReducedMotion()
  if (!player) return null

  const income = getIncomeAtPosition(player.incomeMarkerPosition)

  return (
    <div className="space-y-3 rounded-xl border border-amber-900/25 bg-[#0f0c0a]/55 p-3 shadow-inner shadow-black/30">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-amber-100/80">Your mat</h3>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-semibold">
          <m.span
            className="inline-block text-emerald-400"
            animate={
              moneyPulseLoan && !reduceMotion
                ? {
                  scale: [1, 1.12, 1],
                  color: ['rgb(52, 211, 153)', 'rgb(167, 243, 208)', 'rgb(52, 211, 153)'],
                }
                : { scale: 1 }
            }
            transition={{ duration: 0.75, ease: 'easeOut' }}
          >
            £{player.money}
          </m.span>
          <span className="text-amber-400">{player.vpMarker} VP</span>
          <span className="text-sky-400">Inc: {income}</span>
          <span className="text-stone-400">{player.linkTilesRemaining} links</span>
        </div>
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(player.playerMat || {}).map(([industry, tiles]) => (
            <m.div
              key={industry}
              layout
              style={{ transformOrigin: 'left center' }}
              className={`rounded-lg border px-2 py-1.5 text-xs ${INDUSTRY_COLORS[industry] || 'border-stone-600 bg-stone-900/50'}`}
              animate={
                matFlashIndustry === industry && !reduceMotion
                  ? { scaleX: [1, 0.94, 1], opacity: [1, 0.75, 1] }
                  : { scaleX: 1, opacity: 1 }
              }
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#ebe4d9]">
                  {INDUSTRY_LABELS[industry] || industry}
                </span>
                <span className="tabular-nums text-amber-100/50">{tiles.length}</span>
              </div>
              {tiles.length > 0 && (
                <div className="mt-0.5 text-amber-100/40">
                  Next: L{tiles[0].level} (£{tiles[0].cost})
                </div>
              )}
            </m.div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  )
}
