'use client'

export function MarketTrack ({ coalMarket, ironMarket }) {
  return (
    <div className="space-y-2">
      <MarketRow label="Coal" market={coalMarket} color="bg-zinc-600" emptyPrice={8} />
      <MarketRow label="Iron" market={ironMarket} color="bg-orange-700" emptyPrice={6} />
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
      <span className="text-xs text-stone-400 w-8">{label}</span>
      <div className="flex gap-0.5">
        {Object.entries(byPrice).map(([price, data]) => (
          <div key={price} className="flex flex-col items-center">
            <div className="flex gap-px">
              {Array.from({ length: data.total }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    i < data.filled ? color : 'bg-stone-700 border border-stone-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-[8px] text-stone-500 mt-0.5">£{price}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-stone-500">{filled}/{total}</span>
    </div>
  )
}
