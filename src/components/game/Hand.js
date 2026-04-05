'use client'

import { useGameStore } from '@/store/gameStore'
import { m, AnimatePresence, useReducedMotion } from './motionConfig'

const INDUSTRY_LABELS = {
  cottonMill: 'Cotton',
  manufacturer: 'Manuf.',
  coalMine: 'Coal',
  ironWorks: 'Iron',
  brewery: 'Brew.',
  pottery: 'Pottery',
}

function nextMatTile (player, industry) {
  if (!player || !industry) return null
  const stack = player.playerMat?.[industry]
  return stack?.[0] || null
}

function formatBuildCostLine (tile) {
  if (!tile) return null
  const parts = [`£${tile.cost}`]
  if (tile.coalCost > 0) parts.push(`${tile.coalCost} coal`)
  if (tile.ironCost > 0) parts.push(`${tile.ironCost} iron`)
  if ((tile.beerCost || 0) > 0) parts.push(`${tile.beerCost} beer`)
  return parts.join(' · ')
}

function handCardCostHint (card, player, selectedAction, buildIndustry) {
  if (!player) return null
  if (card.type === 'industry') {
    const t = nextMatTile(player, card.industry)
    return t ? formatBuildCostLine(t) : 'No tile on mat'
  }
  if (card.type === 'wildIndustry') {
    return selectedAction === 'build' && buildIndustry
      ? formatBuildCostLine(nextMatTile(player, buildIndustry)) || 'No tile on mat'
      : 'Wild — pick industry'
  }
  if (card.type === 'location' || card.type === 'wildLocation') {
    if (selectedAction === 'build' && buildIndustry) {
      const t = nextMatTile(player, buildIndustry)
      return t ? formatBuildCostLine(t) : 'No tile on mat'
    }
    if (selectedAction === 'build') {
      return 'Build: set industry'
    }
    return null
  }
  return null
}

function locationIdsAllowingIndustry (gameState, industry) {
  const ids = new Set()
  if (!industry || !gameState?.board?.locations) return ids
  for (const [locId, boardLoc] of Object.entries(gameState.board.locations)) {
    const has = boardLoc.slots?.some(
      s => s.tileId === null && (s.allowedIndustries || []).includes(industry)
    )
    if (has) ids.add(locId)
  }
  return ids
}

function computeMatchingHandCardIds ({
  selectedAction,
  gameState,
  cards,
  buildIndustry,
  selectedCardObj,
  selectedCard,
  developIndustries,
  sellTiles,
}) {
  const match = new Set()
  if (!gameState || !cards?.length) return match

  if (selectedAction === 'build') {
    const indFromPanel = buildIndustry ||
      (selectedCardObj?.type === 'industry' ? selectedCardObj.industry : null)
    if (indFromPanel) {
      const locIds = locationIdsAllowingIndustry(gameState, indFromPanel)
      for (const c of cards) {
        if (c.type === 'industry' && c.industry === indFromPanel) match.add(c.id)
        if (c.type === 'wildIndustry') match.add(c.id)
        if (c.type === 'location' && locIds.has(c.locationId)) match.add(c.id)
        if (c.type === 'wildLocation') match.add(c.id)
      }
    }
    if (selectedCard && selectedCardObj?.type === 'industry') {
      const locIds = locationIdsAllowingIndustry(gameState, selectedCardObj.industry)
      for (const c of cards) {
        if (c.id === selectedCard) continue
        if (c.type === 'location' && locIds.has(c.locationId)) match.add(c.id)
        if (c.type === 'wildLocation') match.add(c.id)
      }
    }
  }

  if (selectedAction === 'develop' && developIndustries?.length > 0) {
    for (const c of cards) {
      if (c.type === 'industry' && developIndustries.includes(c.industry)) match.add(c.id)
      if (c.type === 'wildIndustry' || c.type === 'wildLocation') match.add(c.id)
    }
  }

  if (selectedAction === 'sell' && sellTiles?.length > 0) {
    const inds = new Set()
    for (const s of sellTiles) {
      const tile = gameState.industryTilesOnBoard?.find(t => t.id === s.tileId)
      if (tile?.industry) inds.add(tile.industry)
    }
    for (const c of cards) {
      if (c.type === 'industry' && inds.has(c.industry)) match.add(c.id)
      if (c.type === 'wildIndustry') match.add(c.id)
    }
  }

  if (selectedCard && selectedCardObj?.type === 'industry') {
    const ind = selectedCardObj.industry
    if (selectedAction === 'develop') {
      for (const c of cards) {
        if (c.id === selectedCard) continue
        if (c.type === 'industry' && c.industry === ind) match.add(c.id)
        if (c.type === 'wildIndustry' || c.type === 'wildLocation') match.add(c.id)
      }
    }
    if (selectedAction === 'sell') {
      for (const c of cards) {
        if (c.id === selectedCard) continue
        if (c.type === 'industry' && c.industry === ind) match.add(c.id)
        if (c.type === 'wildIndustry') match.add(c.id)
      }
    }
  }

  return match
}

function computeScoutCompanionDiscardIds (selectedAction, selectedCardId, hand) {
  if (selectedAction !== 'scout' || !selectedCardId || !hand?.length) return new Set()
  const others = hand.filter(c => c.id !== selectedCardId).slice(0, 2)
  return new Set(others.map(c => c.id))
}

function computeValidCardIds (selectedAction, selectedTargets, gameState, cards) {
  if (selectedAction !== 'build' || !gameState) return null

  const locTarget = selectedTargets.find(t => t.type === 'location')

  if (locTarget) {
    const boardLoc = gameState.board.locations[locTarget.id]
    if (!boardLoc) return null

    const allowedIndustries = new Set(
      boardLoc.slots
        .filter(s => s.tileId === null)
        .flatMap(s => s.allowedIndustries || [])
    )

    const valid = new Set()
    for (const card of cards) {
      if (card.type === 'wildLocation' || card.type === 'wildIndustry') {
        valid.add(card.id)
      } else if (card.type === 'location' && card.locationId === locTarget.id) {
        valid.add(card.id)
      } else if (card.type === 'industry' && allowedIndustries.has(card.industry)) {
        valid.add(card.id)
      }
    }
    return valid
  }

  return null
}

export function Hand ({ cards, player, handFlash, embedded = false }) {
  const {
    selectedCard, setSelectedCard, selectedAction, selectedTargets, gameState,
    buildIndustry, developIndustries, sellTiles,
  } = useGameStore()
  const needsCard = selectedAction && !selectedCard
  const reduceMotion = useReducedMotion()

  const validCardIds = computeValidCardIds(selectedAction, selectedTargets, gameState, cards)
  const selectedCardObj = cards.find(c => c.id === selectedCard) || null
  const matchCardIds = computeMatchingHandCardIds({
    selectedAction,
    gameState,
    cards,
    buildIndustry,
    selectedCardObj,
    selectedCard,
    developIndustries,
    sellTiles,
  })
  const scoutCompanionIds = computeScoutCompanionDiscardIds(selectedAction, selectedCard, cards)

  if (!cards || cards.length === 0) {
    return (
      <div className={`text-amber-100/35 ${embedded ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'}`}>
        No cards in hand
      </div>
    )
  }

  const handFlashAnimate =
    handFlash && !reduceMotion
      ? { opacity: [1, 0.88, 1] }
      : {}

  return (
    <div
      className={`transition-colors ${
        embedded ? 'flex h-full min-h-0 flex-col justify-center px-3 py-2' : 'px-4 py-3'
      } ${needsCard ? 'bg-gradient-to-r from-amber-950/40 via-transparent to-amber-950/20' : ''}`}
    >
      {needsCard && (
        <p className={`font-medium text-amber-300/90 animate-pulse ${embedded ? 'mb-1 text-[10px] leading-tight' : 'mb-2 text-xs'}`}>
          {validCardIds
            ? `Select a valid card (${validCardIds.size} available):`
            : 'Select a card to use for this action:'}
        </p>
      )}
      {selectedAction === 'scout' && selectedCard && (
        <p className={`font-medium text-rose-200/75 ${embedded ? 'mb-1 text-[9px] leading-tight' : 'mb-2 text-[10px]'}`}>
          Scout discards this card plus the two marked “with scout” (first two other cards in hand order).
        </p>
      )}
      <m.div
        className={`flex gap-2 overflow-x-auto ${embedded ? 'min-h-[4.25rem] items-center py-0.5 [scrollbar-width:thin]' : 'pb-1'}`}
        animate={handFlashAnimate}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {cards.map(card => {
            const isSelected = selectedCard === card.id
            const isValid = !validCardIds || validCardIds.has(card.id)
            const isDisabled = validCardIds !== null && !isValid
            const buildSharedId =
              selectedAction === 'build' && isSelected ? 'brass-build-pending' : undefined
            const costHint = handCardCostHint(card, player, selectedAction, buildIndustry)

            const isScoutCompanion = scoutCompanionIds.has(card.id)
            const isMatchHint =
              selectedAction !== 'scout' &&
              !isSelected &&
              !isDisabled &&
              matchCardIds.has(card.id)

            const matchRing = isMatchHint
              ? ' ring-2 ring-sky-400/45 ring-offset-2 ring-offset-[#1c1611]'
              : ''
            const scoutRing =
              isScoutCompanion && selectedCard && selectedAction === 'scout'
                ? ' ring-2 ring-rose-400/55 ring-offset-2 ring-offset-[#1c1611]'
                : ''

            return (
              <m.button
                key={card.id}
                type="button"
                layout
                layoutId={buildSharedId ?? `hand-card-${card.id}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: isSelected ? -4 : 0,
                }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{ layout: { duration: 0.28 }, opacity: { duration: 0.22 }, scale: { duration: 0.22 } }}
                onClick={() => {
                  if (isDisabled) return
                  setSelectedCard(isSelected ? null : card.id)
                }}
                title={isDisabled ? 'Cannot use this card for the selected location' : costHint || undefined}
                className={`flex min-w-[4.5rem] max-w-[9rem] flex-shrink-0 flex-col items-stretch rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors${scoutRing}${matchRing} ${
                  isSelected
                    ? 'border-amber-300/70 bg-gradient-to-b from-amber-500 to-amber-900 text-white shadow-xl shadow-amber-950/50 ring-1 ring-amber-400/40'
                    : isDisabled
                      ? 'cursor-not-allowed border-stone-800 bg-stone-900/40 text-stone-600 opacity-45'
                      : needsCard && isValid
                        ? 'border-amber-600/45 bg-gradient-to-b from-stone-600 to-stone-800 text-[#f0ebe3] shadow-md hover:from-stone-500 hover:to-stone-700 hover:border-amber-500/55'
                        : 'border-stone-600/50 bg-gradient-to-b from-stone-700 to-stone-900 text-stone-200 shadow-sm hover:from-stone-600 hover:to-stone-800'
                }`}
              >
                <span className="leading-tight">
                  {card.type === 'location' && (
                    <span>{card.locationName}</span>
                  )}
                  {card.type === 'industry' && (
                    <span>{INDUSTRY_LABELS[card.industry] || card.industry}</span>
                  )}
                  {card.type === 'wildLocation' && (
                    <span className="text-amber-300">Wild Loc</span>
                  )}
                  {card.type === 'wildIndustry' && (
                    <span className="text-amber-300">Wild Ind</span>
                  )}
                </span>
                {isScoutCompanion && selectedCard && selectedAction === 'scout' && (
                  <span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-rose-300/90">
                    With scout
                  </span>
                )}
                {costHint && (
                  <span
                    className={`mt-1 block text-[9px] font-medium leading-snug ${
                      isSelected ? 'text-amber-50/85' : 'text-amber-100/45'
                    }`}
                  >
                    {costHint}
                  </span>
                )}
              </m.button>
            )
          })}
        </AnimatePresence>
      </m.div>
    </div>
  )
}
