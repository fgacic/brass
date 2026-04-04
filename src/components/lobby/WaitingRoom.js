'use client'

export function WaitingRoom ({ room, playerId, onStart, onLeave }) {
  const isHost = room.host === playerId
  const canStart = room.players.length >= 2

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(251,191,36,0.1),transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-amber-900/30 bg-[#1a1510]/80 p-8 shadow-2xl shadow-black/50 backdrop-blur-md ring-1 ring-white/5">
        <div className="text-center">
          <h2 className="font-display text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            Waiting Room
          </h2>
          <div className="mt-4 rounded-xl border border-amber-800/35 bg-gradient-to-br from-[#0f0c0a] to-[#1c1612] p-4 shadow-inner shadow-black/50">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-200/50 mb-2">Room code</p>
            <p className="font-mono text-3xl font-bold tracking-[0.35em] text-amber-100 drop-shadow-sm">
              {room.code}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-100/60">
            Players ({room.players.length}/4)
          </p>
          {room.players.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-xl border p-3 shadow-sm transition ${
                p.id === playerId
                  ? 'border-amber-500/45 bg-gradient-to-r from-amber-950/50 to-amber-900/20 ring-1 ring-amber-500/20'
                  : 'border-stone-700/60 bg-[#14110e]/90'
              }`}
            >
              <span className="font-medium text-[#f5f0e8]">{p.name}</span>
              <div className="flex items-center gap-2">
                {p.id === room.host && (
                  <span className="rounded-md border border-amber-600/40 bg-gradient-to-b from-amber-700 to-amber-900 px-2 py-0.5 text-xs font-semibold text-amber-50 shadow-sm">
                    Host
                  </span>
                )}
                {p.id === playerId && (
                  <span className="text-xs font-medium text-amber-300/80">You</span>
                )}
              </div>
            </div>
          ))}

          {room.players.length < 4 && (
            <div className="rounded-xl border border-dashed border-amber-900/35 bg-[#0f0c0a]/40 p-3 text-center text-sm text-stone-400">
              Waiting for players…
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 rounded-xl border border-stone-600/40 bg-gradient-to-b from-stone-700 to-stone-900 py-3 px-4 font-semibold text-stone-100 shadow-md shadow-black/25 transition hover:from-stone-600 hover:to-stone-800 active:scale-[0.99]"
          >
            Leave
          </button>
          {isHost && (
            <button
              onClick={onStart}
              disabled={!canStart}
              className="flex-1 rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-600 to-amber-900 py-3 px-4 font-semibold text-amber-50 shadow-lg shadow-amber-950/35 transition enabled:hover:from-amber-500 enabled:hover:to-amber-800 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:border-stone-700 disabled:from-stone-800 disabled:to-stone-900 disabled:text-stone-500 disabled:shadow-none"
            >
              Start Game ({room.players.length} players)
            </button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-sm text-amber-100/45">
            Waiting for host to start the game…
          </p>
        )}
      </div>
    </main>
  )
}
