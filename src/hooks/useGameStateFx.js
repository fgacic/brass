'use client'

import { useEffect, useRef, useState } from 'react'

const emptyFx = () => ({
  tilePopId: null,
  linkDrawId: null,
  tileFlipIds: [],
  matFlashIndustry: null,
  moneyPulseLoan: false,
  handFlash: false,
  myTurnFlash: false,
})

/**
 * Detects game state changes after server updates and exposes short-lived UI FX keys.
 */
export function useGameStateFx (gameState, playerId) {
  const prevRef = useRef(null)
  const [fx, setFx] = useState(() => emptyFx())

  useEffect(() => {
    if (!gameState) {
      prevRef.current = null
      return
    }

    const prev = prevRef.current
    prevRef.current = gameState

    if (!prev) return

    const prevLogLen = prev.log?.length || 0
    const curLogLen = gameState.log?.length || 0
    if (curLogLen <= prevLogLen) return

    const next = emptyFx()

    const oldTileIds = new Set(prev.industryTilesOnBoard.map((t) => t.id))
    const addedTile = gameState.industryTilesOnBoard.find((t) => !oldTileIds.has(t.id))
    if (addedTile) next.tilePopId = addedTile.id

    for (const cid of Object.keys(gameState.board.links || {})) {
      const a = prev.board.links[cid]
      const b = gameState.board.links[cid]
      if (a && b && a.ownerId == null && b.ownerId != null) {
        next.linkDrawId = cid
        break
      }
    }

    for (const t of gameState.industryTilesOnBoard) {
      const po = prev.industryTilesOnBoard.find((x) => x.id === t.id)
      if (po && !po.isFlipped && t.isFlipped) next.tileFlipIds.push(t.id)
    }

    const entry = gameState.log[curLogLen - 1]
    if (entry.playerId === playerId) {
      if (entry.action === 'develop' && entry.details?.industries?.length) {
        next.matFlashIndustry = entry.details.industries[0]
      }
      if (entry.action === 'loan') next.moneyPulseLoan = true
      if (entry.action === 'scout') next.handFlash = true
    }

    const prevCur = prev.turnOrder[prev.currentPlayerIndex]
    const newCur = gameState.turnOrder[gameState.currentPlayerIndex]
    if (prevCur !== newCur && newCur === playerId) next.myTurnFlash = true

    const hasFx =
      next.tilePopId ||
      next.linkDrawId ||
      next.tileFlipIds.length > 0 ||
      next.matFlashIndustry ||
      next.moneyPulseLoan ||
      next.handFlash ||
      next.myTurnFlash

    if (!hasFx) return

    setFx(next)
    const t = setTimeout(() => setFx(emptyFx()), 720)
    return () => clearTimeout(t)
  }, [gameState, playerId])

  return fx
}
