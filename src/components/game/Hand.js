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

export function Hand ({ cards, handFlash }) {
  const { selectedCard, setSelectedCard, selectedAction, selectedTargets, gameState } = useGameStore()
  const needsCard = selectedAction && !selectedCard
  const reduceMotion = useReducedMotion()

  const validCardIds = computeValidCardIds(selectedAction, selectedTargets, gameState, cards)

  if (!cards || cards.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-amber-100/35">
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
      className={`px-4 py-3 transition-colors ${
        needsCard ? 'bg-gradient-to-r from-amber-950/40 via-transparent to-amber-950/20' : ''
      }`}
    >
      {needsCard && (
        <p className="mb-2 text-xs font-medium text-amber-300/90 animate-pulse">
          {validCardIds
            ? `Select a valid card (${validCardIds.size} available):`
            : 'Select a card to use for this action:'}
        </p>
      )}
      <m.div
        className="flex gap-2 overflow-x-auto pb-1"
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
                title={isDisabled ? 'Cannot use this card for the selected location' : undefined}
                className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'border-amber-300/70 bg-gradient-to-b from-amber-500 to-amber-900 text-white shadow-xl shadow-amber-950/50 ring-1 ring-amber-400/40'
                    : isDisabled
                      ? 'cursor-not-allowed border-stone-800 bg-stone-900/40 text-stone-600 opacity-45'
                      : needsCard && isValid
                        ? 'border-amber-600/45 bg-gradient-to-b from-stone-600 to-stone-800 text-[#f0ebe3] shadow-md hover:from-stone-500 hover:to-stone-700 hover:border-amber-500/55'
                        : 'border-stone-600/50 bg-gradient-to-b from-stone-700 to-stone-900 text-stone-200 shadow-sm hover:from-stone-600 hover:to-stone-800'
                }`}
              >
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
              </m.button>
            )
          })}
        </AnimatePresence>
      </m.div>
    </div>
  )
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
