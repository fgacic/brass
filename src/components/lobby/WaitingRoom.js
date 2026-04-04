'use client'

export function WaitingRoom ({ room, playerId, onStart, onLeave }) {
  const isHost = room.host === playerId
  const canStart = room.players.length >= 2

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-500">Waiting Room</h2>
          <div className="mt-3 bg-stone-800 rounded-lg p-4 border border-stone-600">
            <p className="text-sm text-stone-400 mb-1">Room Code</p>
            <p className="text-3xl font-mono font-bold text-white tracking-[0.3em]">
              {room.code}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-stone-400">
            Players ({room.players.length}/4)
          </p>
          {room.players.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                p.id === playerId
                  ? 'bg-amber-900/20 border-amber-700'
                  : 'bg-stone-800 border-stone-700'
              }`}
            >
              <span className="text-white font-medium">{p.name}</span>
              <div className="flex items-center gap-2">
                {p.id === room.host && (
                  <span className="text-xs bg-amber-700 text-white px-2 py-0.5 rounded">
                    Host
                  </span>
                )}
                {p.id === playerId && (
                  <span className="text-xs text-stone-400">You</span>
                )}
              </div>
            </div>
          ))}

          {room.players.length < 4 && (
            <div className="p-3 rounded-lg border border-dashed border-stone-700 text-stone-500 text-center text-sm">
              Waiting for players...
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-3 px-4 bg-stone-700 hover:bg-stone-600 text-white rounded-lg font-medium transition-colors"
          >
            Leave
          </button>
          {isHost && (
            <button
              onClick={onStart}
              disabled={!canStart}
              className="flex-1 py-3 px-4 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-lg font-medium transition-colors"
            >
              Start Game ({room.players.length} players)
            </button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-sm text-stone-400">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </main>
  )
}
