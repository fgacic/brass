'use client'

export function TurnInfo ({ gameState, playerId }) {
  const currentPlayerId = gameState.turnOrder[gameState.currentPlayerIndex]
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId)
  const isMyTurn = currentPlayerId === playerId
  const myPlayer = gameState.players.find(p => p.id === playerId)

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b border-stone-700 ${
      isMyTurn ? 'bg-amber-900/30' : 'bg-stone-800'
    }`}>
      <div className="flex items-center gap-4">
        <span className="text-sm text-stone-400">
          {gameState.era === 'canal' ? 'Canal Era' : 'Rail Era'} &middot; Round {gameState.round}
        </span>
        <span className={`text-sm font-medium ${isMyTurn ? 'text-amber-400' : 'text-stone-300'}`}>
          {isMyTurn ? 'Your turn' : `${currentPlayer?.name}'s turn`}
        </span>
        {isMyTurn && myPlayer && (
          <span className="text-xs text-stone-400">
            {myPlayer.actionsRemaining} action{myPlayer.actionsRemaining !== 1 ? 's' : ''} left
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        {gameState.players.map(p => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-2 py-1 rounded ${
              p.id === currentPlayerId ? 'bg-stone-700' : ''
            }`}
          >
            <span className={`w-2 h-2 rounded-full bg-${getPlayerColor(p.color)}`} />
            <span className="text-stone-300">{p.name}</span>
            <span className="text-amber-400">{p.vpMarker}VP</span>
            <span className="text-green-400">£{p.money}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getPlayerColor (color) {
  const map = { red: 'red-500', blue: 'blue-500', yellow: 'yellow-500', purple: 'purple-500' }
  return map[color] || 'stone-400'
}
