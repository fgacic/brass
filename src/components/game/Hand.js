'use client'

import { useGameStore } from '@/store/gameStore'

const INDUSTRY_LABELS = {
  cottonMill: 'Cotton',
  manufacturer: 'Manuf.',
  coalMine: 'Coal',
  ironWorks: 'Iron',
  brewery: 'Brew.',
  pottery: 'Pottery',
}

export function Hand ({ cards, playerId }) {
  const { selectedCard, setSelectedCard, selectedAction, selectedTargets, gameState } = useGameStore()
  const needsCard = selectedAction && !selectedCard

  // When building, compute which cards are valid given what's already selected
  const validCardIds = computeValidCardIds(selectedAction, selectedTargets, gameState, cards)

  if (!cards || cards.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-stone-500">
        No cards in hand
      </div>
    )
  }

  return (
    <div className={`px-4 py-2 transition-colors ${needsCard ? 'bg-amber-900/20' : ''}`}>
      {needsCard && (
        <p className="text-xs text-amber-400 mb-1 animate-pulse">
          {validCardIds
            ? `Select a valid card (${validCardIds.size} available):`
            : 'Select a card to use for this action:'}
        </p>
      )}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {cards.map(card => {
          const isSelected = selectedCard === card.id
          const isValid = !validCardIds || validCardIds.has(card.id)
          const isDisabled = validCardIds !== null && !isValid

          return (
            <button
              key={card.id}
              onClick={() => {
                if (isDisabled) return
                setSelectedCard(isSelected ? null : card.id)
              }}
              title={isDisabled ? 'Cannot use this card for the selected location' : undefined}
              className={`flex-shrink-0 px-3 py-2 rounded text-xs font-medium transition-all border ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-400 -translate-y-1 shadow-lg shadow-amber-900/50'
                  : isDisabled
                    ? 'bg-stone-800/50 text-stone-600 border-stone-700 cursor-not-allowed opacity-40'
                    : needsCard && isValid
                      ? 'bg-stone-700 text-stone-200 border-amber-700/50 hover:bg-stone-600 hover:border-amber-500'
                      : 'bg-stone-700 text-stone-300 border-stone-600 hover:bg-stone-600'
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
            </button>
          )
        })}
      </div>
    </div>
  )
}

function computeValidCardIds (selectedAction, selectedTargets, gameState, cards) {
  if (selectedAction !== 'build' || !gameState) return null

  const locTarget = selectedTargets.find(t => t.type === 'location')

  // Location selected → filter cards to those valid for that location
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
