'use client'

import { PLAYER_COLOR_HEX } from './boardTheme'
import { m, useReducedMotion } from './motionConfig'

export function TurnInfo ({ gameState, playerId, turnBarFlash, moneyPulseLoan }) {
  const reduceMotion = useReducedMotion()
  const currentPlayerId = gameState.turnOrder[gameState.currentPlayerIndex]
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId)
  const isMyTurn = currentPlayerId === playerId
  const myPlayer = gameState.players.find(p => p.id === playerId)

  return (
    <m.div
      className={`flex items-center justify-between gap-4 border-b px-4 py-2.5 shadow-sm ${
        isMyTurn
          ? 'border-amber-600/35 bg-gradient-to-r from-amber-950/55 via-amber-900/20 to-transparent shadow-amber-950/20'
          : 'border-amber-900/20 bg-gradient-to-r from-[#1a1510] to-[#14100d]'
      }`}
      animate={
        turnBarFlash && !reduceMotion
          ? {
            boxShadow: [
              'inset 0 0 0 1px rgba(251, 191, 36, 0.55)',
              'inset 0 0 0 1px transparent',
            ],
          }
          : {}
      }
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="shrink-0 text-sm font-medium text-amber-100/55">
          {gameState.era === 'canal' ? 'Canal era' : 'Rail era'} <span className="text-amber-900/60">·</span> Round {gameState.round}
        </span>
        <span className={`truncate text-sm font-semibold ${isMyTurn ? 'text-amber-300' : 'text-[#ddd6cc]'}`}>
          {isMyTurn ? 'Your turn' : `${currentPlayer?.name}'s turn`}
        </span>
        {isMyTurn && myPlayer && (
          <span className="shrink-0 rounded-md border border-amber-800/40 bg-black/20 px-2 py-0.5 text-xs text-amber-100/70">
            {myPlayer.actionsRemaining} action{myPlayer.actionsRemaining !== 1 ? 's' : ''} left
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-200/40">Players</span>
        <div className="flex flex-wrap justify-end gap-x-2 gap-y-1.5">
          {gameState.players.map(p => {
            const hex = PLAYER_COLOR_HEX[p.color] || '#78716c'
            const isCurrent = p.id === currentPlayerId
            const isYou = p.id === playerId
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1 shadow-sm ${
                  isCurrent
                    ? 'border-amber-500/50 bg-gradient-to-b from-[#2a2218] to-[#1a1510] ring-1 ring-amber-500/35'
                    : 'border-stone-700/50 bg-[#14100d]/90'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/40 shadow-inner"
                  style={{ backgroundColor: hex }}
                  title={p.color}
                />
                <span className="max-w-28 truncate text-xs text-[#ebe4d9]">{p.name}</span>
                {isYou && (
                  <span className="text-[9px] font-bold uppercase text-amber-400/95">You</span>
                )}
                <span className="tabular-nums text-[11px] font-semibold text-amber-400">{p.vpMarker} VP</span>
                <m.span
                  className="tabular-nums text-[11px] font-semibold text-emerald-400 inline-block"
                  animate={
                    isYou && moneyPulseLoan && !reduceMotion
                      ? {
                        scale: [1, 1.12, 1],
                        color: ['rgb(52, 211, 153)', 'rgb(167, 243, 208)', 'rgb(52, 211, 153)'],
                      }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.75, ease: 'easeOut' }}
                >
                  £{p.money}
                </m.span>
              </div>
            )
          })}
        </div>
      </div>
    </m.div>
  )
}
