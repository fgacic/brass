'use client'

import { useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useLobbyStore } from '@/store/lobbyStore'
import { useGameStore } from '@/store/gameStore'
import { WaitingRoom } from '@/components/lobby/WaitingRoom'
import { GameView } from '@/components/game/GameView'

const devLobbyClientEnabled = process.env.NEXT_PUBLIC_BRASS_DEV_LOBBY === '1'

export default function Home () {
  const { createRoom, joinRoom, devQuickJoin, startGame, leaveRoom } = useSocket()
  const { room, playerId, error, isConnected } = useLobbyStore()
  const { gameState } = useGameStore()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState(null)

  if (gameState) {
    return <GameView playerId={playerId} />
  }

  if (room) {
    return (
      <WaitingRoom
        room={room}
        playerId={playerId}
        onStart={startGame}
        onLeave={leaveRoom}
      />
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.14),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(180,83,9,0.08),transparent),radial-gradient(ellipse_50%_50%_at_0%_80%,rgba(20,184,166,0.06),transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-amber-900/30 bg-[#1a1510]/75 p-8 shadow-2xl shadow-black/50 backdrop-blur-md ring-1 ring-white/5">
        <div className="text-center">
          <h1 className="font-display text-5xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 drop-shadow-sm">
            Brass
          </h1>
          <p className="font-display text-xl text-amber-100/85 mt-1 tracking-wide">Birmingham</p>
          <p className={`text-sm mt-4 font-medium ${isConnected ? 'text-emerald-400/90' : 'text-amber-200/50'}`}>
            {isConnected ? '● Connected' : 'Connecting…'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-gradient-to-br from-red-950/80 to-red-900/30 p-3 text-center text-sm text-red-200 shadow-inner shadow-red-950/50">
            {error}
          </div>
        )}

        {!mode && (
          <div className="space-y-3">
            {devLobbyClientEnabled && (
              <div className="space-y-2 rounded-xl border border-emerald-800/40 bg-emerald-950/25 p-3">
                <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-emerald-200/70">
                  Dev lobby (no code)
                </p>
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-emerald-900/50 bg-[#0f0c0a]/80 py-2 px-3 text-sm text-[#faf7f2] placeholder:text-stone-500 shadow-inner focus:border-emerald-600/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => devQuickJoin(name.trim())}
                  disabled={!isConnected}
                  className="w-full rounded-lg border border-emerald-600/40 bg-gradient-to-b from-emerald-800 to-emerald-950 py-2.5 px-3 text-sm font-semibold text-emerald-50 shadow-md transition enabled:hover:from-emerald-700 enabled:hover:to-emerald-900 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quick join dev room
                </button>
              </div>
            )}
            <button
              onClick={() => setMode('create')}
              className="w-full rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-600 to-amber-900 py-3.5 px-4 font-semibold text-amber-50 shadow-lg shadow-amber-950/40 transition hover:from-amber-500 hover:to-amber-800 hover:shadow-amber-900/30 active:scale-[0.99]"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full rounded-xl border border-stone-500/30 bg-gradient-to-b from-stone-600 to-stone-800 py-3.5 px-4 font-semibold text-stone-100 shadow-md shadow-black/30 transition hover:from-stone-500 hover:to-stone-700 active:scale-[0.99]"
            >
              Join Game
            </button>
          </div>
        )}

        {mode && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-amber-900/40 bg-[#0f0c0a]/80 py-3 px-4 text-[#faf7f2] placeholder:text-stone-500 shadow-inner shadow-black/40 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
              maxLength={20}
            />

            {mode === 'join' && (
              <input
                type="text"
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-amber-900/40 bg-[#0f0c0a]/80 py-3 px-4 text-center uppercase tracking-[0.35em] text-[#faf7f2] placeholder:text-stone-500 placeholder:tracking-normal shadow-inner shadow-black/40 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                maxLength={5}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setMode(null); setJoinCode('') }}
                className="flex-1 rounded-xl border border-stone-600/40 bg-gradient-to-b from-stone-700 to-stone-900 py-3 px-4 font-semibold text-stone-200 shadow-md shadow-black/25 transition hover:from-stone-600 hover:to-stone-800 active:scale-[0.99]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!name.trim()) return
                  if (mode === 'create') createRoom(name.trim())
                  else if (joinCode.length === 5) joinRoom(joinCode, name.trim())
                }}
                disabled={!name.trim() || (mode === 'join' && joinCode.length !== 5)}
                className="flex-1 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-600 to-amber-900 py-3 px-4 font-semibold text-amber-50 shadow-lg shadow-amber-950/35 transition enabled:hover:from-amber-500 enabled:hover:to-amber-800 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:border-stone-700 disabled:from-stone-800 disabled:to-stone-900 disabled:text-stone-500 disabled:shadow-none"
              >
                {mode === 'create' ? 'Create' : 'Join'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
