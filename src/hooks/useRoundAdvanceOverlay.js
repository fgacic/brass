'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * When gameState.round increases (new turn after full player order), exposes the
 * new turn number for a short full-screen celebration overlay (UI label: Turn).
 */
export function useRoundAdvanceOverlay (gameState) {
  const prevRoundRef = useRef(null)
  const [overlayRound, setOverlayRound] = useState(null)

  useEffect(() => {
    if (!gameState) {
      prevRoundRef.current = null
      setOverlayRound(null)
      return
    }

    const prev = prevRoundRef.current
    if (prev === null) {
      prevRoundRef.current = gameState.round
      return
    }

    if (gameState.round > prev) {
      setOverlayRound(gameState.round)
    }
    prevRoundRef.current = gameState.round
  }, [gameState])

  useEffect(() => {
    if (overlayRound === null) return
    const t = setTimeout(() => setOverlayRound(null), 3200)
    return () => clearTimeout(t)
  }, [overlayRound])

  return overlayRound
}
