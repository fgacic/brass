'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ROUNDS_PER_ERA } from '@/game/constants'
import { getLocationById } from '@/game/data/locations'
import { PLAYER_COLOR_HEX } from './boardTheme'
import { m, useReducedMotion } from './motionConfig'

function hexToRgba (hex, alpha) {
  const n = hex.replace('#', '')
  const v = n.length === 3 ? n.split('').map((c) => c + c).join('') : n
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getMyIndustryLocationIds (gameState, playerId) {
  const set = new Set()
  for (const t of gameState.industryTilesOnBoard || []) {
    if (t.ownerId === playerId) set.add(t.locationId)
  }
  return [...set].sort((a, b) => {
    const na = getLocationById(a)?.name ?? a
    const nb = getLocationById(b)?.name ?? b
    return na.localeCompare(nb)
  })
}

function canalFullRoundsUntilRail (gameState) {
  if (gameState.era !== 'canal' || gameState.phase === 'gameOver') return null
  const total = ROUNDS_PER_ERA[gameState.playerCount]
  if (total == null) return null
  return Math.max(0, total - gameState.round + 1)
}

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
  const canalRoundsLeft = canalFullRoundsUntilRail(gameState)
  const myIndustryLocationIds = useMemo(
    () => getMyIndustryLocationIds(gameState, playerId),
    [gameState, playerId]
  )
  const myColorHex = myPlayer ? (PLAYER_COLOR_HEX[myPlayer.color] || '#78716c') : null

  return (
    <m.div
      className={`relative flex min-h-0 flex-col border-b px-3 py-2.5 shadow-sm sm:px-4 sm:py-3 ${
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
      {myColorHex && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `linear-gradient(100deg, ${hexToRgba(myColorHex, 0.16)} 0%, ${hexToRgba(myColorHex, 0.06)} 28%, transparent 55%)`,
          }}
        />
      )}
      <div className="relative z-10 flex min-h-0 w-full items-center justify-between gap-3 sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
        <span className="shrink-0 text-xs font-medium text-amber-100/55 sm:text-sm">
          {gameState.era === 'canal' ? 'Canal' : 'Rail'} <span className="text-amber-900/60">·</span> T{gameState.round}
        </span>
        <span className={`min-w-0 truncate text-xs font-semibold sm:text-sm ${isMyTurn ? 'text-amber-300' : 'text-[#ddd6cc]'}`}>
          {isMyTurn ? 'Your turn' : `${currentPlayer?.name}'s turn`}
        </span>
        {isMyTurn && myPlayer && (
          <span className="shrink-0 rounded border border-amber-800/40 bg-black/20 px-1.5 py-px text-[10px] text-amber-100/70 sm:px-2 sm:text-xs">
            {myPlayer.actionsRemaining} left
          </span>
        )}
      </div>

      <div className="flex min-w-0 max-w-full items-center justify-end gap-2 sm:gap-3">
        <span className="mr-1.5 hidden shrink-0 text-[8px] font-bold uppercase tracking-wider text-amber-200/45 md:inline">
          Order
        </span>
        <div
          ref={rowRef}
          className="relative flex min-w-0 flex-nowrap items-center justify-end gap-x-1 overflow-x-auto overflow-y-visible py-1.5 pl-0.5 pr-1 [scrollbar-width:thin] sm:gap-x-2 sm:py-2 sm:pl-1 sm:pr-1.5"
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
          {gameState.turnOrder.flatMap((orderedPlayerId, orderIndex) => {
            const p = gameState.players.find(x => x.id === orderedPlayerId)
            if (!p) return []

            const hex = PLAYER_COLOR_HEX[p.color] || '#78716c'
            const isCurrent = p.id === currentPlayerId
            const isYou = p.id === playerId
            const isLast = orderIndex >= gameState.turnOrder.length - 1
            const nextId = !isLast ? gameState.turnOrder[orderIndex + 1] : null

            const column = (
              <div
                key={p.id}
                className="relative z-2 flex shrink-0 items-center gap-1 py-0.5 sm:gap-1.5"
              >
                <div className="relative shrink-0">
                  <span
                    className={`absolute -top-1 -left-0.5 z-10 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full px-0.5 text-[8px] font-bold tabular-nums shadow-sm sm:-top-1 sm:h-4 sm:text-[9px] ${
                      isCurrent
                        ? 'bg-amber-500/95 text-stone-950 ring-1 ring-amber-300/60'
                        : 'bg-stone-800/95 text-amber-100/75 ring-1 ring-stone-600/70'
                    }`}
                    title={`Order ${orderIndex + 1}`}
                  >
                    {orderIndex + 1}
                  </span>
                  <div
                    ref={(el) => {
                      if (el) slotRefs.current[p.id] = el
                      else delete slotRefs.current[p.id]
                    }}
                    className="rounded-full p-px ring-1 ring-stone-600/75 ring-offset-1 ring-offset-[#14100d] sm:p-0.5"
                  >
                    <div
                      className="h-7 w-7 shrink-0 rounded-full border-2 border-black/45 shadow-inner shadow-black/30 sm:h-8 sm:w-8"
                      style={{ backgroundColor: hex }}
                      title={`${p.name} (${p.color})`}
                    />
                  </div>
                </div>
                <div className="min-w-0 max-w-[3.25rem] leading-tight sm:max-w-[4.75rem]">
                  <div className="flex items-center gap-0.5">
                    <span className="truncate text-[10px] font-semibold text-[#ebe4d9] sm:text-[11px]">
                      {p.name}
                    </span>
                    {isYou && (
                      <span className="shrink-0 text-[7px] font-bold uppercase text-amber-400/90">You</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-1 text-[8px] tabular-nums sm:text-[9px]">
                    <span className="font-semibold whitespace-nowrap text-amber-400/90">{p.vpMarker} VP</span>
                    <m.span
                      className="font-semibold whitespace-nowrap text-emerald-400/95"
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
              </div>
            )

            if (isLast) return [column]

            return [
              column,
              <div
                key={`arrow-${p.id}-to-${nextId}`}
                className="relative z-2 flex shrink-0 items-center self-center text-amber-400/55"
                aria-hidden
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </div>
            ]
          })}
        </div>
        {canalRoundsLeft !== null && (
          <div
            className="shrink-0 rounded-md border border-sky-900/50 bg-gradient-to-b from-sky-950/50 to-slate-950/60 px-2 py-1 text-right shadow-sm shadow-black/20"
            title="Full table rounds left in canal era at this player count (rulebook: 10 / 9 / 8 for 2–4 players). The game switches to rail when the draw pile and all hands are empty at end of a round, which usually aligns with this count."
          >
            <div className="text-[7px] font-bold uppercase leading-none tracking-wider text-sky-300/55">
              Rail era
            </div>
            <div className="mt-0.5 flex items-baseline justify-end gap-1 leading-none">
              <span className="text-lg font-bold tabular-nums text-sky-100 sm:text-xl">
                {canalRoundsLeft}
              </span>
              <span className="text-[9px] font-medium text-sky-200/50">
                {canalRoundsLeft === 1 ? 'round' : 'rounds'}
              </span>
            </div>
          </div>
        )}
      </div>
      </div>

      {myColorHex && myIndustryLocationIds.length > 0 && (
        <div className="relative z-10 mt-2 flex min-w-0 items-start gap-2 border-t border-amber-900/25 pt-2 sm:mt-2.5 sm:gap-2.5 sm:pt-2.5">
          <span
            className="shrink-0 pt-0.5 text-[8px] font-bold uppercase leading-none tracking-wider text-amber-200/40 sm:text-[9px]"
            title="Locations where you have industry on the board"
          >
            Your cities
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1 sm:gap-1.5">
            {myIndustryLocationIds.map((locId) => {
              const loc = getLocationById(locId)
              const label = loc?.name ?? locId
              return (
                <span
                  key={locId}
                  title={label}
                  className="max-w-[7.5rem] truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-white/95 shadow-sm ring-1 ring-black/25 sm:max-w-[9rem] sm:px-2 sm:text-[10px]"
                  style={{
                    backgroundColor: hexToRgba(myColorHex, 0.32),
                    border: `1px solid ${hexToRgba(myColorHex, 0.5)}`,
                  }}
                >
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </m.div>
  )
}
