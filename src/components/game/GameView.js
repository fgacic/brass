'use client'

import { useGameStore } from '@/store/gameStore'
import { Board } from './Board'
import { PlayerMat } from './PlayerMat'
import { Hand } from './Hand'
import { ActionPanel } from './ActionPanel'
import { TurnInfo } from './TurnInfo'
import { GameLog } from './GameLog'
import { MarketTrack } from './MarketTrack'
import { GameOver } from './GameOver'

export function GameView ({ playerId }) {
  const { gameState } = useGameStore()

  if (!gameState) return <div className="text-center p-8">Loading...</div>

  if (gameState.phase === 'gameOver') {
    return <GameOver gameState={gameState} playerId={playerId} />
  }

  const myPlayer = gameState.players.find(p => p.id === playerId)
  const isMyTurn = gameState.turnOrder[gameState.currentPlayerIndex] === playerId

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-900">
      <TurnInfo gameState={gameState} playerId={playerId} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Board gameState={gameState} playerId={playerId} />
        </div>

        <div className="w-80 flex flex-col border-l border-stone-700 bg-stone-800/50">
          <div className="flex-1 overflow-auto p-3 space-y-3">
            <MarketTrack
              coalMarket={gameState.coalMarket}
              ironMarket={gameState.ironMarket}
            />
            <PlayerMat player={myPlayer} />
            <GameLog log={gameState.log} players={gameState.players} />
          </div>
        </div>
      </div>

      <div className="border-t border-stone-700 bg-stone-800">
        <Hand cards={myPlayer?.hand || []} playerId={playerId} />
        {isMyTurn && (
          <ActionPanel
            gameState={gameState}
            playerId={playerId}
          />
        )}
      </div>
    </div>
  )
}
