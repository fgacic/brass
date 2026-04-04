'use client'

export function GameOver ({ gameState, playerId }) {
  const rankings = gameState.rankings || []
  const winner = rankings[0]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-500">Game Over</h1>
          {winner && (
            <p className="text-xl text-amber-200 mt-2">
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
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  i === 0
                    ? 'bg-amber-900/30 border-amber-700'
                    : isMe
                      ? 'bg-stone-800/80 border-stone-600'
                      : 'bg-stone-800 border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${i === 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                    #{r.rank}
                  </span>
                  <div>
                    <p className="text-white font-medium">
                      {r.name} {isMe && <span className="text-stone-400 text-sm">(you)</span>}
                    </p>
                    <p className="text-sm text-stone-400">
                      £{player?.money || 0} &middot; Income: {player?.incomeMarkerPosition || 0}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-400">
                  {r.vp} VP
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
        >
          Play Again
        </button>
      </div>
    </main>
  )
}
