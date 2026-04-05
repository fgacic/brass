'use client'

import { getIronAvailableCount, getCoalByLocation } from '@/game/board-resource-summary'

export function BoardResourceSummary ({ gameState }) {
  const iron = getIronAvailableCount(gameState)
  const { rows, totalBoard } = getCoalByLocation(gameState)

  return (
    <div className="space-y-2 rounded-xl border border-amber-900/25 bg-[#0f0c0a]/55 p-3 shadow-inner shadow-black/30">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-amber-200/45">
        Board supply
      </h3>
      <p
        className="text-xs tabular-nums text-amber-100/80"
        title="Iron cubes on unflipped iron works on the board (not the demand track)"
      >
        <span className="text-amber-100/50">Iron</span>{' '}
        <span className="font-semibold text-orange-200/95">{iron}</span>
      </p>
      <div className="border-t border-amber-900/20 pt-2">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200/40">
          Coal (mines)
        </p>
        {rows.length === 0 ? (
          <p className="text-[11px] text-amber-100/35">None on the board</p>
        ) : (
          <ul className="max-h-32 space-y-0.5 overflow-y-auto text-[11px] leading-snug [scrollbar-width:thin]">
            {rows.map((r) => (
              <li
                key={r.locationId}
                className="flex justify-between gap-2 tabular-nums text-amber-100/70"
              >
                <span className="min-w-0 truncate">{r.name}</span>
                <span className="shrink-0 font-medium text-zinc-200/90">{r.count}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1.5 border-t border-amber-900/15 pt-1 text-[11px] tabular-nums text-amber-100/55">
          <span className="text-amber-100/45">Total (mines)</span>{' '}
          <span className="font-semibold text-zinc-100/90">{totalBoard}</span>
        </p>
      </div>
    </div>
  )
}
