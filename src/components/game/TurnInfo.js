'use client'

import { PLAYER_COLOR_HEX } from './boardTheme'

export function TurnInfo ({ gameState, playerId }) {
  const currentPlayerId = gameState.turnOrder[gameState.currentPlayerIndex]
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId)
  const isMyTurn = currentPlayerId === playerId
  const myPlayer = gameState.players.find(p => p.id === playerId)

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-2 border-b border-stone-700 ${
      isMyTurn ? 'bg-amber-900/30' : 'bg-stone-800'
    }`}>
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-sm text-stone-400 shrink-0">
          {gameState.era === 'canal' ? 'Canal Era' : 'Rail Era'} &middot; Round {gameState.round}
        </span>
        <span className={`text-sm font-medium truncate ${isMyTurn ? 'text-amber-400' : 'text-stone-300'}`}>
          {isMyTurn ? 'Your turn' : `${currentPlayer?.name}'s turn`}
        </span>
        {isMyTurn && myPlayer && (
          <span className="text-xs text-stone-400 shrink-0">
            {myPlayer.actionsRemaining} action{myPlayer.actionsRemaining !== 1 ? 's' : ''} left
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[9px] text-stone-500 font-semibold uppercase tracking-wide">Players</span>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1.5">
          {gameState.players.map(p => {
            const hex = PLAYER_COLOR_HEX[p.color] || '#78716c'
            const isCurrent = p.id === currentPlayerId
            const isYou = p.id === playerId
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                  isCurrent ? 'bg-stone-700/90 ring-1 ring-amber-500/60' : 'bg-stone-800/60'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-stone-900/80 shadow-sm"
                  style={{ backgroundColor: hex }}
                  title={p.color}
                />
                <span className="text-xs text-stone-200 max-w-28 truncate">{p.name}</span>
                {isYou && (
                  <span className="text-[9px] uppercase text-amber-400/90 font-medium">You</span>
                )}
                <span className="text-[11px] text-amber-400 tabular-nums">{p.vpMarker} VP</span>
                <span className="text-[11px] text-green-400 tabular-nums">£{p.money}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
