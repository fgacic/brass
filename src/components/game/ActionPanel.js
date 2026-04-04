'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { m, useReducedMotion } from './motionConfig'

const ACTIONS = [
  { type: 'build', label: 'Build', desc: 'Place an industry tile' },
  { type: 'network', label: 'Network', desc: 'Place a canal/rail link' },
  { type: 'develop', label: 'Develop', desc: 'Remove tiles from mat' },
  { type: 'sell', label: 'Sell', desc: 'Flip industry tiles' },
  { type: 'loan', label: 'Loan', desc: 'Take £30, lose 3 income levels' },
  { type: 'scout', label: 'Scout', desc: 'Discard 3 cards, get wilds' },
  { type: 'pass', label: 'Pass', desc: 'Skip this action' },
]

const INDUSTRY_LABELS = {
  cottonMill: 'Cotton',
  manufacturer: 'Manuf.',
  coalMine: 'Coal',
  ironWorks: 'Iron',
  brewery: 'Brewery',
  pottery: 'Pottery',
}

function pickMerchantAccepting (merchants, industry) {
  const entries = Object.entries(merchants || {}).filter(([, m]) => {
    if (m.demandSlots?.length) {
      return m.demandSlots.some((s) => (s.acceptedIndustries || []).includes(industry))
    }
    return Array.isArray(m.acceptedIndustries) && m.acceptedIndustries.includes(industry)
  })
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  return entries[0]?.[0] ?? null
}

function formatLocName (id) {
  if (!id) return ''
  const names = {
    stokeOnTrent: 'Stoke-on-Trent', burtonOnTrent: 'Burton-on-Trent',
    coalbrookdale: 'Coalbrookdale', wolverhampton: 'Wolverhampton',
    kidderminster: 'Kidderminster', farmBrewery1: 'Farm Brewery',
    farmBrewery2: 'Farm Brewery',
  }
  return names[id] || id.charAt(0).toUpperCase() + id.slice(1)
}

export function ActionPanel ({ gameState, playerId }) {
  const {
    selectedAction, setSelectedAction, selectedCard,
    setTargetingMode, selectedTargets, actionError,
    actionSubmitting, actionErrorTick,
    resetAction, setActionError, clearActionError,
    buildIndustry, setBuildIndustry,
  } = useGameStore()
  const { build, network, develop, sell, loan, scout, pass } = useGameActions()
  const reduceMotion = useReducedMotion()
  const [developIndustries, setDevelopIndustries] = useState([])
  const [sellTiles, setSellTiles] = useState([])
  const [showDebug, setShowDebug] = useState(false)

  const myPlayer = gameState.players.find(p => p.id === playerId)
  const locationTarget = selectedTargets.find(t => t.type === 'location')
  const connectionTargets = selectedTargets.filter(t => t.type === 'connection')

  // Industries allowed by the selected location's empty slots
  const locationAllowedIndustries = locationTarget
    ? new Set(
        (gameState.board.locations[locationTarget.id]?.slots || [])
          .filter(s => s.tileId === null)
          .flatMap(s => s.allowedIndustries || [])
      )
    : null

  const selectedCardObj = myPlayer?.hand?.find(c => c.id === selectedCard) || null

  // Auto-set buildIndustry when an industry card is selected
  useEffect(() => {
    if (selectedAction === 'build' && selectedCardObj?.type === 'industry') {
      setBuildIndustry(selectedCardObj.industry)
    }
  }, [selectedCard]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear buildIndustry if location changes and industry is no longer valid
  useEffect(() => {
    if (buildIndustry && locationTarget) {
      const allowed = new Set(
        (gameState.board.locations[locationTarget.id]?.slots || [])
          .filter(s => s.tileId === null)
          .flatMap(s => s.allowedIndustries || [])
      )
      if (!allowed.has(buildIndustry)) setBuildIndustry(null)
    }
  }, [locationTarget?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleActionSelect = (actionType) => {
    clearActionError()
    setSelectedAction(actionType)
    setBuildIndustry(null)
    setDevelopIndustries([])
    setSellTiles([])

    switch (actionType) {
      case 'build':
        setTargetingMode('location')
        break
      case 'network':
        setTargetingMode('connection')
        break
      default:
        setTargetingMode(null)
    }
  }

  const handleCancel = () => {
    resetAction()
    setBuildIndustry(null)
    setDevelopIndustries([])
    setSellTiles([])
  }

  const getMissingSteps = () => {
    const missing = []
    if (!selectedCard) missing.push('select a card')

    switch (selectedAction) {
      case 'build': {
        if (!buildIndustry) missing.push('pick an industry')
        if (!locationTarget) missing.push('click a location on the map')
        break
      }
      case 'network': {
        const conns = selectedTargets.filter(t => t.type === 'connection')
        if (conns.length === 0) missing.push('click a link on the map')
        break
      }
      case 'develop':
        if (developIndustries.length === 0) missing.push('pick industry to develop')
        break
      case 'sell':
        if (sellTiles.length === 0) missing.push('select tiles to sell')
        break
      case 'scout':
        if ((myPlayer?.hand || []).length < 3) missing.push('need at least 3 cards')
        break
    }
    return missing
  }

  const buildPayload = () => {
    switch (selectedAction) {
      case 'build':
        return { cardId: selectedCard, locationId: locationTarget?.id, industry: buildIndustry }
      case 'network':
        return { cardId: selectedCard, connectionIds: connectionTargets.map(t => t.id) }
      case 'develop':
        return { cardId: selectedCard, industries: developIndustries }
      case 'sell':
        return { cardId: selectedCard, tileSells: sellTiles }
      case 'loan':
        return { cardId: selectedCard }
      case 'scout': {
        const hand = myPlayer?.hand || []
        const otherCards = hand.filter(c => c.id !== selectedCard).slice(0, 2)
        return { cardId: selectedCard, discardCardIds: otherCards.map(c => c.id) }
      }
      case 'pass':
        return { cardId: selectedCard }
      default:
        return {}
    }
  }

  const handleConfirm = () => {
    const missing = getMissingSteps()
    if (missing.length > 0) {
      setActionError(`Still need to: ${missing.join(', ')}`)
      return
    }

    const payload = buildPayload()
    console.log('[ActionPanel] Confirming:', selectedAction, JSON.stringify(payload))

    switch (selectedAction) {
      case 'build':
        build(payload.cardId, payload.locationId, payload.industry)
        break
      case 'network':
        network(payload.cardId, payload.connectionIds)
        break
      case 'develop':
        develop(payload.cardId, payload.industries)
        break
      case 'sell':
        sell(payload.cardId, payload.tileSells)
        break
      case 'loan':
        loan(payload.cardId)
        break
      case 'scout':
        scout(payload.cardId, payload.discardCardIds)
        break
      case 'pass':
        pass(payload.cardId)
        break
    }
  }

  const isReady = getMissingSteps().length === 0

  return (
    <div className="space-y-2 border-t border-amber-900/20 bg-[#0f0c0a]/50 px-4 py-3">
      {actionError && (
        <m.div
          key={actionErrorTick}
          role="alert"
          aria-live="polite"
          initial={{ x: 0 }}
          animate={
            reduceMotion
              ? {}
              : { x: [0, -5, 5, -5, 5, 0] }
          }
          transition={{ duration: 0.42, ease: 'easeInOut' }}
          className="rounded-lg border border-red-500/35 bg-gradient-to-r from-red-950/60 to-red-900/20 px-3 py-2 text-xs text-red-200 shadow-inner"
        >
          {actionError}
        </m.div>
      )}

      {!selectedAction ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-100/55">Choose an action</p>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="rounded-md border border-stone-600/40 bg-stone-900/80 px-2 py-0.5 text-[10px] text-stone-400 transition hover:border-amber-800/50 hover:text-amber-100/80"
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map(a => (
              <button
                key={a.type}
                onClick={() => handleActionSelect(a.type)}
                className="rounded-lg border border-stone-600/35 bg-gradient-to-b from-stone-600 to-stone-800 px-3 py-2 text-xs font-semibold text-stone-100 shadow-md shadow-black/25 transition hover:from-stone-500 hover:to-stone-700 hover:shadow-lg active:scale-[0.98]"
                title={a.desc}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-amber-400 font-medium capitalize">
              {selectedAction}
            </span>

            <span className="text-amber-900/45">|</span>

            {selectedCard ? (
              <span className="text-xs text-green-400">
                Card: {selectedCardObj?.locationName || selectedCardObj?.industry || selectedCard}
              </span>
            ) : (
              <span className="text-xs text-yellow-500 animate-pulse">Click a card below</span>
            )}

            {selectedAction === 'build' && (
              <>
                <span className="text-amber-900/45">|</span>
                {buildIndustry ? (
                  <>
                    <span className="text-xs text-green-400">
                      {INDUSTRY_LABELS[buildIndustry] || buildIndustry}
                    </span>
                    <span className="text-amber-900/45">|</span>
                  </>
                ) : (
                  <span className="text-xs text-yellow-500 animate-pulse">Pick industry below</span>
                )}
                {locationTarget ? (
                  <span className="text-xs text-green-400">
                    {formatLocName(locationTarget.id)}
                  </span>
                ) : (
                  <span className="text-xs text-yellow-500 animate-pulse">Click a location on map</span>
                )}
              </>
            )}

            {selectedAction === 'network' && (
              <>
                <span className="text-amber-900/45">|</span>
                {connectionTargets.length > 0 ? (
                  <span className="text-xs text-green-400">Link selected</span>
                ) : (
                  <span className="text-xs text-yellow-500 animate-pulse">Click a link on map</span>
                )}
              </>
            )}

            <button
              onClick={() => setShowDebug(!showDebug)}
              className="ml-auto rounded-md border border-stone-600/40 bg-stone-900/80 px-2 py-0.5 text-[10px] text-stone-400 transition hover:text-amber-100/80"
            >
              {showDebug ? 'Hide' : 'Debug'}
            </button>
          </div>

          {selectedAction === 'build' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-stone-400 mr-1">Industry:</span>
              {locationAllowedIndustries && locationAllowedIndustries.size === 0 && (
                <span className="text-xs text-red-400">No empty slots at this location</span>
              )}
              {Object.entries(INDUSTRY_LABELS).map(([ind, label]) => {
                const tiles = myPlayer?.playerMat?.[ind]
                const hasTiles = tiles && tiles.length > 0
                const allowedHere = !locationAllowedIndustries || locationAllowedIndustries.has(ind)
                const allowedByCard = !selectedCardObj || selectedCardObj.type !== 'industry' || selectedCardObj.industry === ind
                const isEnabled = hasTiles && allowedHere && allowedByCard
                if (locationAllowedIndustries && !allowedHere) return null
                if (selectedCardObj?.type === 'industry' && !allowedByCard) return null
                return (
                  <button
                    key={ind}
                    onClick={() => setBuildIndustry(ind)}
                    disabled={!isEnabled}
                    className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                      buildIndustry === ind
                        ? 'border-amber-400/60 bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow-md shadow-amber-950/40'
                        : isEnabled
                          ? 'border-stone-600/40 bg-gradient-to-b from-stone-600 to-stone-800 text-stone-100 hover:from-stone-500 hover:to-stone-700'
                          : 'cursor-not-allowed border-stone-800 bg-stone-900/60 text-stone-600'
                    }`}
                  >
                    {label}
                    {!hasTiles && <span className="ml-1 text-stone-500">(none)</span>}
                  </button>
                )
              })}
              {!locationAllowedIndustries && (
                <span className="text-xs text-stone-500 italic">select a location first to filter</span>
              )}
            </div>
          )}

          {selectedAction === 'develop' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-400 mr-1">Remove (1-2):</span>
              {Object.entries(myPlayer?.playerMat || {}).map(([ind, tiles]) => {
                if (tiles.length === 0) return null
                const isSelected = developIndustries.includes(ind)
                return (
                  <button
                    key={ind}
                    onClick={() => {
                      if (isSelected) {
                        setDevelopIndustries(developIndustries.filter(i => i !== ind))
                      } else if (developIndustries.length < 2) {
                        setDevelopIndustries([...developIndustries, ind])
                      }
                    }}
                    className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                      isSelected
                        ? 'border-amber-400/60 bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow-md'
                        : 'border-stone-600/40 bg-gradient-to-b from-stone-600 to-stone-800 text-stone-100 hover:from-stone-500 hover:to-stone-700'
                    }`}
                  >
                    {INDUSTRY_LABELS[ind] || ind} (L{tiles[0].level})
                  </button>
                )
              })}
              {developIndustries.length > 0 && (
                <span className="text-xs text-green-400">{developIndustries.length} selected</span>
              )}
            </div>
          )}

          {selectedAction === 'sell' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-stone-400 mr-1">Tiles:</span>
              {gameState.industryTilesOnBoard
                .filter(t => t.ownerId === playerId && !t.isFlipped && t.flipsOnSell)
                .map(tile => {
                  const isSel = sellTiles.some(s => s.tileId === tile.id)
                  return (
                    <button
                      key={tile.id}
                      onClick={() => {
                        if (isSel) {
                          setSellTiles(sellTiles.filter(s => s.tileId !== tile.id))
                        } else {
                          const merchantId = pickMerchantAccepting(
                            gameState.board.merchants,
                            tile.industry
                          )
                          if (!merchantId) {
                            setActionError('No merchant city demands this industry')
                            return
                          }
                          clearActionError()
                          setSellTiles([...sellTiles, {
                            tileId: tile.id,
                            merchantLocationId: merchantId,
                            useMerchantBeer: true,
                          }])
                        }
                      }}
                      className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                        isSel
                          ? 'border-amber-400/60 bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow-md'
                          : 'border-stone-600/40 bg-gradient-to-b from-stone-600 to-stone-800 text-stone-100 hover:from-stone-500 hover:to-stone-700'
                      }`}
                    >
                      L{tile.level} {INDUSTRY_LABELS[tile.industry] || tile.industry}
                    </button>
                  )
                })}
              {gameState.industryTilesOnBoard.filter(
                t => t.ownerId === playerId && !t.isFlipped && t.flipsOnSell
              ).length === 0 && (
                <span className="text-xs text-stone-500">No tiles to sell</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="rounded-lg border border-stone-600/40 bg-gradient-to-b from-stone-600 to-stone-800 px-3 py-2 text-xs font-semibold text-stone-200 shadow-sm transition hover:from-stone-500 hover:to-stone-700 active:scale-[0.99]"
            >
              Cancel
            </button>
            <m.button
              type="button"
              onClick={handleConfirm}
              disabled={!isReady || actionSubmitting}
              whileTap={isReady && !actionSubmitting && !reduceMotion ? { scale: 0.98 } : undefined}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition disabled:cursor-wait ${
                isReady && !actionSubmitting
                  ? 'border-amber-400/50 bg-gradient-to-b from-amber-500 to-amber-900 text-amber-50 shadow-lg shadow-amber-950/40 hover:from-amber-400 hover:to-amber-800'
                  : 'cursor-not-allowed border-stone-700 bg-stone-800/80 text-stone-500'
              }`}
            >
              {actionSubmitting && (
                <span
                  className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-amber-200/30 border-t-amber-100"
                  aria-hidden
                />
              )}
              {actionSubmitting ? 'Sending…' : 'Confirm'}
            </m.button>
            {!isReady && (
              <span className="text-xs text-stone-500 italic">
                {getMissingSteps().join(' · ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Debug overlay */}
      {showDebug && (
        <div className="mt-2 max-h-48 space-y-1 overflow-auto rounded-lg border border-stone-700/60 bg-[#080706] p-2 font-mono text-[10px] text-stone-400 shadow-inner">
          <div className="text-stone-500 font-bold mb-1">-- DEBUG --</div>
          <div>action: <span className="text-amber-400">{selectedAction || 'none'}</span></div>
          <div>targetingMode: <span className="text-cyan-400">{useGameStore.getState().targetingMode || 'none'}</span></div>
          <div>selectedCard: <span className="text-green-400">{selectedCard || 'none'}</span></div>
          {selectedCardObj && (
            <div>card details: <span className="text-green-300">
              type={selectedCardObj.type}
              {selectedCardObj.locationId && ` loc=${selectedCardObj.locationId}`}
              {selectedCardObj.locationName && ` name=${selectedCardObj.locationName}`}
              {selectedCardObj.industry && ` ind=${selectedCardObj.industry}`}
            </span></div>
          )}
          <div>buildIndustry: <span className="text-purple-400">{buildIndustry || 'none'}</span></div>
          <div>targets: <span className="text-blue-400">
            {selectedTargets.length === 0 ? 'none' : selectedTargets.map(t => `${t.type}:${t.id}`).join(', ')}
          </span></div>
          <div>locationTarget: <span className="text-blue-300">{locationTarget?.id || 'none'}</span></div>
          {selectedAction && (
            <div>payload: <span className="text-yellow-300">{JSON.stringify(buildPayload())}</span></div>
          )}
          {selectedAction && (
            <div>missing: <span className={getMissingSteps().length ? 'text-red-400' : 'text-green-400'}>
              {getMissingSteps().length ? getMissingSteps().join(', ') : 'READY'}
            </span></div>
          )}
          <div>actionsRemaining: <span className="text-stone-300">{myPlayer?.actionsRemaining}</span></div>
          <div>money: <span className="text-stone-300">£{myPlayer?.money}</span></div>
          {actionError && <div>lastError: <span className="text-red-400">{actionError}</span></div>}
          {selectedAction === 'build' && locationTarget && buildIndustry && (
            <div>
              slotCheck: <span className="text-orange-400">
                {(() => {
                  const loc = gameState.board.locations[locationTarget.id]
                  if (!loc) return 'location not found in board'
                  const emptySlot = loc.slots.find(s =>
                    s.tileId === null && s.allowedIndustries?.includes(buildIndustry)
                  )
                  if (emptySlot) return `OK - slot accepts ${buildIndustry}`
                  const anyEmpty = loc.slots.some(s => s.tileId === null)
                  if (!anyEmpty) return 'all slots occupied'
                  const allowed = loc.slots
                    .filter(s => s.tileId === null)
                    .map(s => (s.allowedIndustries || []).join('/'))
                  return `no slot for ${buildIndustry}, available: [${allowed.join('], [')}]`
                })()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
