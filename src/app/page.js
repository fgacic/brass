'use client'

import { useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useLobbyStore } from '@/store/lobbyStore'
import { useGameStore } from '@/store/gameStore'
import { WaitingRoom } from '@/components/lobby/WaitingRoom'
import { GameView } from '@/components/game/GameView'

export default function Home () {
  const { createRoom, joinRoom, startGame, leaveRoom } = useSocket()
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
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-amber-500 tracking-tight">
            Brass
          </h1>
          <p className="text-xl text-amber-200/70 mt-1">Birmingham</p>
          <p className="text-sm text-stone-400 mt-4">
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-3 px-4 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-3 px-4 bg-stone-700 hover:bg-stone-600 text-white rounded-lg font-medium transition-colors"
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
              className="w-full py-3 px-4 bg-stone-800 border border-stone-600 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              maxLength={20}
            />

            {mode === 'join' && (
              <input
                type="text"
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full py-3 px-4 bg-stone-800 border border-stone-600 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 tracking-widest text-center uppercase"
                maxLength={5}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setMode(null); setJoinCode('') }}
                className="flex-1 py-3 px-4 bg-stone-700 hover:bg-stone-600 text-white rounded-lg font-medium transition-colors"
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
                className="flex-1 py-3 px-4 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-lg font-medium transition-colors"
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
