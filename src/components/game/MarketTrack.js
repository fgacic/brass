'use client'

export function MarketTrack ({ coalMarket, ironMarket }) {
  return (
    <div className="space-y-3 rounded-xl border border-amber-900/25 bg-[#0f0c0a]/55 p-3 shadow-inner shadow-black/30">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-amber-200/45">Markets</h3>
      <MarketRow label="Coal" market={coalMarket} color="bg-gradient-to-br from-zinc-500 to-zinc-800" emptyPrice={8} />
      <MarketRow label="Iron" market={ironMarket} color="bg-gradient-to-br from-orange-500 to-orange-900" emptyPrice={6} />
    </div>
  )
}

function MarketRow ({ label, market, color, emptyPrice }) {
  if (!market) return null

  const filled = market.filter(s => s.filled).length
  const total = market.length

  const byPrice = {}
  for (const space of market) {
    if (!byPrice[space.price]) byPrice[space.price] = { total: 0, filled: 0 }
    byPrice[space.price].total++
    if (space.filled) byPrice[space.price].filled++
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-xs font-semibold text-amber-100/55">{label}</span>
      <div className="flex gap-0.5">
        {Object.entries(byPrice).map(([price, data]) => (
          <div key={price} className="flex flex-col items-center">
            <div className="flex gap-px">
              {Array.from({ length: data.total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-sm shadow-sm ${
                    i < data.filled
                      ? `${color} ring-1 ring-black/30`
                      : 'border border-stone-600/80 bg-stone-800/90'
                  }`}
                />
              ))}
            </div>
            <span className="mt-0.5 text-[8px] font-medium text-amber-100/40">£{price}</span>
          </div>
        ))}
      </div>
      <span className="text-xs tabular-nums text-stone-400">{filled}/{total}</span>
    </div>
  )
}
