'use client'

import { useGameStore } from '@/store/gameStore'
import { useGameStateFx } from '@/hooks/useGameStateFx'
import { useMyTurnSound } from '@/hooks/useMyTurnSound'
import { useRoundAdvanceOverlay } from '@/hooks/useRoundAdvanceOverlay'
import { RoundAdvanceOverlay } from './RoundAdvanceOverlay'
import { Board } from './Board'
import { PlayerMat } from './PlayerMat'
import { Hand } from './Hand'
import { ActionPanel } from './ActionPanel'
import { TurnInfo } from './TurnInfo'
import { GameLog } from './GameLog'
import { MarketTrack } from './MarketTrack'
import { GameOver } from './GameOver'
import { GameMotionRoot } from './motionConfig'

export function GameView ({ playerId }) {
  const { gameState } = useGameStore()
  const boardFx = useGameStateFx(gameState, playerId)
  useMyTurnSound(boardFx.myTurnFlash)
  const overlayRound = useRoundAdvanceOverlay(gameState)

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1c1611] via-[#121a15] to-[#0c1012]">
        <p className="font-display text-lg text-amber-200/70">Loading game…</p>
      </div>
    )
  }

  if (gameState.phase === 'gameOver') {
    return <GameOver gameState={gameState} playerId={playerId} />
  }

  const myPlayer = gameState.players.find(p => p.id === playerId)
  const isMyTurn = gameState.turnOrder[gameState.currentPlayerIndex] === playerId

  return (
    <GameMotionRoot>
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#16120f] via-[#12100e] to-[#0a0c0b]">
      <TurnInfo
        gameState={gameState}
        playerId={playerId}
        turnBarFlash={boardFx.myTurnFlash}
        moneyPulseLoan={boardFx.moneyPulseLoan}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.35)]">
          <Board gameState={gameState} playerId={playerId} boardFx={boardFx} />
        </div>

        <div className="flex w-80 flex-col border-l border-amber-900/25 bg-gradient-to-b from-[#1f1813]/95 to-[#14100d]/98 shadow-[-12px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="flex-1 space-y-4 overflow-auto p-4">
            <MarketTrack
              coalMarket={gameState.coalMarket}
              ironMarket={gameState.ironMarket}
            />
            <PlayerMat
              player={myPlayer}
              matFlashIndustry={boardFx.matFlashIndustry}
              moneyPulseLoan={boardFx.moneyPulseLoan}
            />
            <GameLog log={gameState.log} players={gameState.players} />
          </div>
        </div>
      </div>

      <div className="border-t border-amber-900/30 bg-gradient-to-r from-[#1c1611] via-[#221a14] to-[#1c1611] shadow-[0_-12px_40px_rgba(0,0,0,0.4)] ring-1 ring-black/20">
        <Hand cards={myPlayer?.hand || []} player={myPlayer} handFlash={boardFx.handFlash} />
        {isMyTurn && (
          <ActionPanel
            gameState={gameState}
            playerId={playerId}
          />
        )}
      </div>
      <RoundAdvanceOverlay round={overlayRound} />
    </div>
    </GameMotionRoot>
  )
}
