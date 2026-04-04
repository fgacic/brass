'use client'

export function GameOver ({ gameState, playerId }) {
  const rankings = gameState.rankings || []
  const winner = rankings[0]

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,rgba(251,191,36,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-amber-900/30 bg-[#1a1510]/85 p-8 shadow-2xl shadow-black/50 backdrop-blur-md ring-1 ring-white/5">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700">
            Game over
          </h1>
          {winner && (
            <p className="mt-3 text-xl font-medium text-amber-100/90">
              {winner.name} wins!
            </p>
          )}
        </div>

        <div className="space-y-2">
          {rankings.map((r, i) => {
            const player = gameState.players.find(p => p.id === r.playerId)
            const isMe = r.playerId === playerId

            return (
              <div
                key={r.playerId}
                className={`flex items-center justify-between rounded-xl border p-4 shadow-sm ${
                  i === 0
                    ? 'border-amber-500/45 bg-gradient-to-r from-amber-950/50 to-amber-900/15 ring-1 ring-amber-500/25'
                    : isMe
                      ? 'border-amber-900/30 bg-[#14100e]/95'
                      : 'border-stone-700/50 bg-[#12100e]/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${i === 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                    #{r.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-[#f5f0e8]">
                      {r.name} {isMe && <span className="text-sm font-normal text-amber-200/50">(you)</span>}
                    </p>
                    <p className="text-sm text-amber-100/40">
                      £{player?.money || 0} &middot; Income: {player?.incomeMarkerPosition || 0}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-400 tabular-nums">
                  {r.vp} VP
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-600 to-amber-900 py-3.5 px-4 font-bold text-amber-50 shadow-lg shadow-amber-950/35 transition hover:from-amber-500 hover:to-amber-800 active:scale-[0.99]"
        >
          Play again
        </button>
      </div>
    </main>
  )
}
