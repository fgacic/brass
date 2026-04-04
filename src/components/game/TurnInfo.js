'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { PLAYER_COLOR_HEX } from './boardTheme'
import { m, useReducedMotion } from './motionConfig'

function useTurnOrderHighlightBox (currentPlayerId, turnOrderKey) {
  const rowRef = useRef(null)
  const slotRefs = useRef({})
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return

    const measure = () => {
      const el = currentPlayerId ? slotRefs.current[currentPlayerId] : null
      if (!el || !row) return
      const rowRect = row.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      setBox({
        left: r.left - rowRect.left,
        top: r.top - rowRect.top,
        width: r.width,
        height: r.height
      })
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(row)
    window.addEventListener('resize', measure)
    const id = requestAnimationFrame(measure)
    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [currentPlayerId, turnOrderKey])

  return { rowRef, slotRefs, box }
}

export function TurnInfo ({ gameState, playerId, turnBarFlash, moneyPulseLoan }) {
  const reduceMotion = useReducedMotion()
  const currentPlayerId = gameState.turnOrder[gameState.currentPlayerIndex]
  const turnOrderKey = gameState.turnOrder.join(',')
  const { rowRef, slotRefs, box } = useTurnOrderHighlightBox(currentPlayerId, turnOrderKey)
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
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="shrink-0 text-sm font-medium text-amber-100/55">
          {gameState.era === 'canal' ? 'Canal era' : 'Rail era'} <span className="text-amber-900/60">·</span> Turn {gameState.round}
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

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200/55">
          Turn order
        </span>
        <div
          ref={rowRef}
          className="relative flex flex-wrap justify-end gap-x-4 gap-y-3 overflow-visible"
        >
          {box && (
            <m.div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-1 rounded-full border-[3px] border-amber-400/95 bg-amber-400/10 shadow-[0_0_22px_rgba(251,191,36,0.45)] ring-2 ring-amber-300/40 ring-offset-2 ring-offset-[#14100d]/90"
              initial={false}
              animate={{
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 260, damping: 30, mass: 1.15 }
              }
            />
          )}
          {gameState.turnOrder.map((orderedPlayerId, orderIndex) => {
            const p = gameState.players.find(x => x.id === orderedPlayerId)
            if (!p) return null
            const hex = PLAYER_COLOR_HEX[p.color] || '#78716c'
            const isCurrent = p.id === currentPlayerId
            const isYou = p.id === playerId

            return (
              <div
                key={p.id}
                className="relative z-[2] flex w-[4.75rem] flex-col items-center gap-1"
              >
                <span
                  className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                    isCurrent
                      ? 'bg-amber-500/90 text-stone-950 shadow-md shadow-amber-900/40'
                      : 'bg-stone-800/90 text-amber-100/65 ring-1 ring-stone-600/60'
                  }`}
                  title={`Order ${orderIndex + 1}`}
                >
                  {orderIndex + 1}
                </span>
                <div className="relative flex flex-col items-center pb-4">
                  <div
                    ref={(el) => {
                      if (el) slotRefs.current[p.id] = el
                      else delete slotRefs.current[p.id]
                    }}
                    className="rounded-full p-0.5 ring-1 ring-stone-600/75 ring-offset-1 ring-offset-[#14100d]"
                  >
                    <div
                      className="h-11 w-11 shrink-0 rounded-full border-2 border-black/45 shadow-inner shadow-black/30"
                      style={{ backgroundColor: hex }}
                      title={`${p.name} (${p.color})`}
                    />
                  </div>
                  {isCurrent && (
                    <span className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-amber-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-stone-950 shadow-md shadow-amber-950/50">
                      Now
                    </span>
                  )}
                </div>
                <span className="max-w-full truncate text-center text-[10px] font-medium leading-tight text-[#ebe4d9]">
                  {p.name}
                </span>
                {isYou && (
                  <span className="text-[8px] font-bold uppercase text-amber-400/95">You</span>
                )}
                <div className="flex flex-col items-center gap-px text-[9px] leading-tight tabular-nums">
                  <span className="font-semibold text-amber-400/90">{p.vpMarker} VP</span>
                  <m.span
                    className="font-semibold text-emerald-400/95"
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
              </div>
            )
          })}
        </div>
      </div>
    </m.div>
  )
}
