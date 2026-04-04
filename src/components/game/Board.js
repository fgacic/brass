'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { LOCATION_POSITIONS } from '@/game/data/board-location-positions'

const PLAYER_COLORS = {
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
}

const INDUSTRY_COLORS = {
  cottonMill: '#3b82f6',
  manufacturer: '#8b5cf6',
  coalMine: '#71717a',
  ironWorks: '#f97316',
  brewery: '#b45309',
  pottery: '#14b8a6',
}

const INDUSTRY_LETTERS = {
  cottonMill: 'C',
  manufacturer: 'M',
  coalMine: 'K',
  ironWorks: 'I',
  brewery: 'B',
  pottery: 'P',
}

// Static connection metadata (canal/rail flags) — must mirror board-connections.js
const CONNECTION_META = {
  'warrington-stokeOnTrent':       { canal: true,  rail: true  },
  'stokeOnTrent-leek':             { canal: true,  rail: true  },
  'stokeOnTrent-stone':            { canal: true,  rail: true  },
  'leek-belper':                   { canal: false, rail: true  },
  'stone-uttoxeter':               { canal: false, rail: true  },
  'stone-stafford':                { canal: true,  rail: true  },
  'uttoxeter-derby':               { canal: false, rail: true  },
  'derby-belper':                  { canal: true,  rail: true  },
  'derby-nottingham':              { canal: true,  rail: true  },
  'derby-burtonOnTrent':           { canal: true,  rail: true  },
  'stafford-cannock':              { canal: true,  rail: true  },
  'cannock-farmBrewery1':          { canal: true,  rail: true  },
  'cannock-burtonOnTrent':         { canal: false, rail: true  },
  'cannock-wolverhampton':         { canal: true,  rail: true  },
  'wolverhampton-coalbrookdale':   { canal: true,  rail: true  },
  'wolverhampton-walsall':         { canal: true,  rail: true  },
  'coalbrookdale-shrewsbury':      { canal: true,  rail: true  },
  'coalbrookdale-kidderminster':   { canal: true,  rail: true  },
  'walsall-birmingham':            { canal: true,  rail: true  },
  'walsall-cannock':               { canal: true,  rail: true  },
  'walsall-tamworth':              { canal: false, rail: true  },
  'tamworth-burtonOnTrent':        { canal: true,  rail: true  },
  'tamworth-nuneaton':             { canal: true,  rail: true  },
  'nuneaton-coventry':             { canal: false, rail: true  },
  'coventry-birmingham':           { canal: true,  rail: true  },
  'dudley-birmingham':             { canal: true,  rail: true  },
  'dudley-kidderminster':          { canal: true,  rail: true  },
  'dudley-wolverhampton':          { canal: true,  rail: true  },
  'kidderminster-worcester':       { canal: true,  rail: true  },
  'kidderminster-farmBrewery2':    { canal: true,  rail: true  },
  'worcester-gloucester':          { canal: true,  rail: true  },
  'worcester-birmingham':          { canal: true,  rail: true  },
  'worcester-farmBrewery2':        { canal: true,  rail: true  },
  'gloucester-redditch':           { canal: true,  rail: true  },
  'redditch-birmingham':           { canal: false, rail: true  },
  'redditch-oxford':               { canal: true,  rail: true  },
  'birmingham-nuneaton':           { canal: false, rail: true  },
  'birmingham-oxford':             { canal: true,  rail: true  },
  'birmingham-tamworth':           { canal: true,  rail: true  },
}

// Unbuilt line styles per connection type
const LINK_STYLE = {
  canal: { stroke: '#a8a29e', dash: '2 4',   width: 2 },   // dots  . . .
  rail:  { stroke: '#a8a29e', dash: '8 4',   width: 2 },   // dashes  — — —
  both:  { stroke: '#a8a29e', dash: '8 4 2 4', width: 2 }, // dash-dot  —.—.
}

const DEFAULT_VB = { x: -20, y: -20, w: 660, h: 720 }
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const DRAG_THRESHOLD = 4

function parseConnectionEndpoints (connId) {
  // Sort longest-first so 'stokeOnTrent' is matched before 'stone', etc.
  const knownLocations = Object.keys(LOCATION_POSITIONS).sort((a, b) => b.length - a.length)
  for (const loc of knownLocations) {
    if (connId.startsWith(loc + '-')) {
      const rest = connId.slice(loc.length + 1)
      const other = knownLocations.find(l => rest === l || rest.startsWith(l))
      if (other) return [loc, other]
    }
  }
  return null
}

/** Orbital industry badges (same layout as buildable location slots). */
function renderOrbitalSlotBadges (pos, baseR, slots, keyPrefix) {
  if (!slots.length) return null
  return (
    <g pointerEvents="none">
      {slots.map((slot, idx) => {
        const total = slots.length
        const spreadDeg = total === 1 ? 0 : total === 2 ? 60 : total === 3 ? 55 : 42
        const startDeg = -90 - spreadDeg * (total - 1) / 2
        const angleDeg = startDeg + idx * spreadDeg
        const angleRad = angleDeg * Math.PI / 180
        const orbitR = baseR + 20
        const cx = pos.x + Math.cos(angleRad) * orbitR
        const cy = pos.y + Math.sin(angleRad) * orbitR

        const isOccupied = slot.tileId !== null
        if (isOccupied) return null

        const industries = slot.allowedIndustries || []
        if (industries.length === 0) return null

        if (industries.length === 1) {
          const ind = industries[0]
          return (
            <g key={`${keyPrefix}-${idx}`}>
              <circle cx={cx} cy={cy} r={9} fill={INDUSTRY_COLORS[ind] || '#555'} stroke="#1c1917" strokeWidth={1.5} />
              <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="bold">
                {INDUSTRY_LETTERS[ind] || '?'}
              </text>
            </g>
          )
        }

        const [ind0, ind1] = industries
        return (
          <g key={`${keyPrefix}-${idx}`}>
            <circle cx={cx} cy={cy} r={9} fill={INDUSTRY_COLORS[ind0] || '#555'} stroke="#1c1917" strokeWidth={1.5} />
            <path
              d={`M ${cx} ${cy - 9} A 9 9 0 0 1 ${cx} ${cy + 9} Z`}
              fill={INDUSTRY_COLORS[ind1] || '#555'}
            />
            <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} stroke="#1c1917" strokeWidth={1} />
            <circle cx={cx} cy={cy} r={9} fill="none" stroke="#1c1917" strokeWidth={1.5} />
            <text x={cx - 4} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6" fontWeight="bold">
              {INDUSTRY_LETTERS[ind0] || '?'}
            </text>
            <text x={cx + 4} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6" fontWeight="bold">
              {INDUSTRY_LETTERS[ind1] || '?'}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function Board ({ gameState, playerId }) {
  const { targetingMode, selectedTargets, addTarget, selectedAction, selectedCard } = useGameStore()
  const svgRef = useRef(null)
  const [vb, setVb] = useState({ ...DEFAULT_VB })
  const panRef = useRef({ active: false, hasDragged: false, startX: 0, startY: 0, startVb: null })
  const pinchRef = useRef({ dist: 0 })

  const selectedLocationId = selectedTargets.find(t => t.type === 'location')?.id || null
  const selectedConnectionIds = new Set(selectedTargets.filter(t => t.type === 'connection').map(t => t.id))

  // Compute which locations are valid targets when a card is selected during build
  const myPlayer = gameState.players.find(p => p.id === playerId)
  const selectedCardObj = myPlayer?.hand?.find(c => c.id === selectedCard) || null
  const buildValidLocations = buildValidLocationSet(selectedAction, selectedCardObj, gameState)

  const handleLocationClick = useCallback((e, locationId) => {
    if (panRef.current.hasDragged) return
    e.stopPropagation()
    console.log('[Board] Location clicked:', locationId, 'targetingMode:', targetingMode)
    if (targetingMode === 'location') {
      addTarget({ type: 'location', id: locationId })
    }
  }, [targetingMode, addTarget])

  const handleConnectionClick = useCallback((e, connId) => {
    if (panRef.current.hasDragged) return
    e.stopPropagation()
    console.log('[Board] Connection clicked:', connId, 'targetingMode:', targetingMode)
    if (targetingMode === 'connection') {
      addTarget({ type: 'connection', id: connId })
    }
  }, [targetingMode, addTarget])

  const screenToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const sx = (clientX - rect.left) / rect.width
    const sy = (clientY - rect.top) / rect.height
    return { x: vb.x + sx * vb.w, y: vb.y + sy * vb.h }
  }, [vb])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 1.12 : 1 / 1.12
    const svgPt = screenToSvg(e.clientX, e.clientY)

    setVb(prev => {
      const newW = prev.w * zoomFactor
      const newH = prev.h * zoomFactor
      const scaleW = newW / DEFAULT_VB.w
      if (scaleW < MIN_ZOOM || scaleW > MAX_ZOOM) return prev
      return {
        x: svgPt.x - (svgPt.x - prev.x) * zoomFactor,
        y: svgPt.y - (svgPt.y - prev.y) * zoomFactor,
        w: newW,
        h: newH,
      }
    })
  }, [screenToSvg])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    panRef.current = { active: true, hasDragged: false, startX: e.clientX, startY: e.clientY, startVb: { ...vb } }
  }, [vb])

  const handleMouseMove = useCallback((e) => {
    const pan = panRef.current
    if (!pan.active) return

    const dx = e.clientX - pan.startX
    const dy = e.clientY - pan.startY

    if (!pan.hasDragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
    pan.hasDragged = true

    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgDx = dx / rect.width * pan.startVb.w
    const svgDy = dy / rect.height * pan.startVb.h
    setVb({ x: pan.startVb.x - svgDx, y: pan.startVb.y - svgDy, w: pan.startVb.w, h: pan.startVb.h })
  }, [])

  const handleMouseUp = useCallback(() => {
    setTimeout(() => { panRef.current.active = false }, 0)
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy) }
    } else if (e.touches.length === 1) {
      panRef.current = {
        active: true, hasDragged: false,
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        startVb: { ...vb },
      }
    }
  }, [vb])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newDist = Math.sqrt(dx * dx + dy * dy)
      const scale = pinchRef.current.dist / newDist
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const svgPt = screenToSvg(midX, midY)

      setVb(prev => {
        const newW = prev.w * scale
        const newH = prev.h * scale
        const scaleW = newW / DEFAULT_VB.w
        if (scaleW < MIN_ZOOM || scaleW > MAX_ZOOM) return prev
        return {
          x: svgPt.x - (svgPt.x - prev.x) * scale,
          y: svgPt.y - (svgPt.y - prev.y) * scale,
          w: newW,
          h: newH,
        }
      })
      pinchRef.current.dist = newDist
    } else if (e.touches.length === 1 && panRef.current.active) {
      const pan = panRef.current
      const dx = e.touches[0].clientX - pan.startX
      const dy = e.touches[0].clientY - pan.startY
      if (!pan.hasDragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
      pan.hasDragged = true

      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const svgDx = dx / rect.width * pan.startVb.w
      const svgDy = dy / rect.height * pan.startVb.h
      setVb({ x: pan.startVb.x - svgDx, y: pan.startVb.y - svgDy, w: pan.startVb.w, h: pan.startVb.h })
    }
  }, [screenToSvg])

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => { panRef.current.active = false }, 0)
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const prevent = (e) => e.preventDefault()
    svg.addEventListener('wheel', prevent, { passive: false })
    return () => svg.removeEventListener('wheel', prevent)
  }, [])

  const resetView = useCallback(() => setVb({ ...DEFAULT_VB }), [])

  const drawnPairs = new Set()

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="w-full h-full"
        style={{ touchAction: 'none', cursor: panRef.current.hasDragged ? 'grabbing' : 'default' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <rect x={vb.x - 500} y={vb.y - 500} width={vb.w + 1000} height={vb.h + 1000} fill="#1c1917" />

        {/* Connection lines */}
        {Object.entries(gameState.board.links).map(([connId, link]) => {
          const endpoints = parseConnectionEndpoints(connId)
          if (!endpoints) return null
          const [from, to] = endpoints

          const pairKey = [from, to].sort().join('|')
          const isDuplicate = drawnPairs.has(pairKey)
          drawnPairs.add(pairKey)

          const fromPos = LOCATION_POSITIONS[from]
          const toPos = LOCATION_POSITIONS[to]
          if (!fromPos || !toPos) return null

          const isBuilt = link.ownerId !== null
          const isSelected = selectedConnectionIds.has(connId)
          const isTargetable = targetingMode === 'connection' && !isBuilt

          const meta = CONNECTION_META[connId] || { canal: true, rail: true }
          const linkType = meta.canal && meta.rail ? 'both' : meta.canal ? 'canal' : 'rail'
          const style = LINK_STYLE[linkType]

          const ownerColor = isBuilt
            ? PLAYER_COLORS[gameState.players.find(p => p.id === link.ownerId)?.color] || '#888'
            : style.stroke

          const dx = toPos.x - fromPos.x
          const dy = toPos.y - fromPos.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const offset = isDuplicate ? 6 : 0
          const nx = -dy / len * offset
          const ny = dx / len * offset

          // Era-based dim: canal-only links dim in rail era, rail-only in canal era
          const era = gameState.era
          const isWrongEra = (era === 'canal' && !meta.canal) || (era === 'rail' && !meta.rail)

          return (
            <g key={connId} opacity={!isBuilt && isWrongEra ? 0.25 : 1}>
              {isTargetable && (
                <line
                  x1={fromPos.x + nx} y1={fromPos.y + ny}
                  x2={toPos.x + nx} y2={toPos.y + ny}
                  stroke="transparent" strokeWidth={16}
                  className="cursor-pointer"
                  onClick={(e) => handleConnectionClick(e, connId)}
                />
              )}
              <line
                x1={fromPos.x + nx} y1={fromPos.y + ny}
                x2={toPos.x + nx} y2={toPos.y + ny}
                stroke={isSelected ? '#f59e0b' : isBuilt ? ownerColor : style.stroke}
                strokeWidth={isSelected ? 5 : isBuilt ? 4 : style.width}
                strokeDasharray={isSelected ? 'none' : isBuilt ? 'none' : style.dash}
                pointerEvents="none"
              />
              {isSelected && (
                <line
                  x1={fromPos.x + nx} y1={fromPos.y + ny}
                  x2={toPos.x + nx} y2={toPos.y + ny}
                  stroke="#fbbf24" strokeWidth={7} opacity={0.3} pointerEvents="none"
                >
                  <animate attributeName="opacity" values="0.15;0.45;0.15" dur="1.5s" repeatCount="indefinite" />
                </line>
              )}
            </g>
          )
        })}

        {/* Location nodes */}
        {Object.entries(LOCATION_POSITIONS).map(([locId, pos]) => {
          const isMerchant = ['shrewsbury', 'gloucester', 'oxford', 'warrington', 'nottingham'].includes(locId)
          const isFarm = locId.startsWith('farmBrewery')
          const isSelected = selectedLocationId === locId
          const isTargetable = targetingMode === 'location' && !isMerchant &&
            (!buildValidLocations || buildValidLocations.has(locId))

          const boardLoc = gameState.board.locations[locId]
          const merchantData = isMerchant ? gameState.board.merchants?.[locId] : null
          const tilesHere = gameState.industryTilesOnBoard.filter(t => t.locationId === locId)
          const baseR = isMerchant ? 14 : isFarm ? 12 : 18
          const r = isSelected ? baseR + 3 : baseR

          const slots = boardLoc?.slots || []
          const merchantDemandSlots = merchantData
            ? (merchantData.acceptedIndustries || []).map((ind) => ({
              allowedIndustries: [ind],
              tileId: null,
            }))
            : []

          return (
            <g key={locId}
              onClick={(e) => isTargetable && handleLocationClick(e, locId)}
              className={isTargetable ? 'cursor-pointer' : ''}
            >
              {/* Transparent hit area covers node + orbital badges */}
              {isTargetable && (
                <circle cx={pos.x} cy={pos.y} r={baseR + 30} fill="transparent" />
              )}

              {/* Selection glow */}
              {isSelected && (
                <circle cx={pos.x} cy={pos.y} r={r + 4} fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.8}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Targetable hint ring */}
              {isTargetable && !isSelected && (
                <circle cx={pos.x} cy={pos.y} r={baseR + 4} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" opacity={0.8}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Main circle */}
              <circle
                cx={pos.x} cy={pos.y} r={r}
                fill={isSelected ? '#451a03' : isMerchant ? '#78350f' : isFarm ? '#365314' : '#292524'}
                stroke={isSelected ? '#f59e0b' : isMerchant ? '#d97706' : isFarm ? '#65a30d' : '#57534e'}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />

              {/* Buildable slots (towns/cities) or merchant demand — same orbital badge style */}
              {!isMerchant && slots.length > 0 && renderOrbitalSlotBadges(pos, baseR, slots, `slot-${locId}`)}
              {isMerchant && merchantDemandSlots.length > 0 &&
                renderOrbitalSlotBadges(pos, baseR, merchantDemandSlots, `merch-${locId}`)}

              {isMerchant && merchantData?.beerAvailable && (
                <circle
                  cx={pos.x + 16}
                  cy={pos.y - 10}
                  r={4}
                  fill="#ca8a04"
                  stroke="#fbbf24"
                  strokeWidth={1}
                  pointerEvents="none"
                />
              )}

              {/* Placed industry tiles */}
              {tilesHere.map((tile, idx) => {
                const angle = (idx * 2 * Math.PI) / Math.max(tilesHere.length, 1) - Math.PI / 2
                const radius = tilesHere.length > 1 ? 10 : 0
                const tx = pos.x + Math.cos(angle) * radius
                const ty = pos.y + Math.sin(angle) * radius

                const ownerPlayer = gameState.players.find(p => p.id === tile.ownerId)
                const outlineColor = ownerPlayer ? PLAYER_COLORS[ownerPlayer.color] : '#555'

                return (
                  <g key={tile.id}>
                    <rect
                      x={tx - 7} y={ty - 7} width={14} height={14} rx={2}
                      fill={tile.isFlipped ? '#1a1a1a' : INDUSTRY_COLORS[tile.industry] || '#555'}
                      stroke={outlineColor} strokeWidth={1.5}
                    />
                    <text x={tx} y={ty + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="bold" pointerEvents="none">
                      {tile.level}
                    </text>
                    {tile.resourcesRemaining > 0 && (
                      <text x={tx + 6} y={ty - 6} textAnchor="middle" dominantBaseline="middle" fill="#fbbf24" fontSize="6" fontWeight="bold" pointerEvents="none">
                        {tile.resourcesRemaining}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Location name */}
              {(() => {
                const name = formatLocationName(locId)
                const labelY = pos.y + (isMerchant ? 24 : 30)
                const parts = name.split('-')
                return (
                  <g pointerEvents="none">
                    {parts.map((part, i) => (
                      <text
                        key={i}
                        x={pos.x}
                        y={labelY + i * 9}
                        textAnchor="middle"
                        fill={isSelected ? '#fbbf24' : '#d4cfc9'}
                        fontSize={9}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        stroke="#1c1917"
                        strokeWidth={2.5}
                        paintOrder="stroke"
                      >
                        {part}
                      </text>
                    ))}
                  </g>
                )
              })()}
            </g>
          )
        })}
      </svg>

      {/* Link type legend */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 bg-stone-900/80 border border-stone-700 rounded px-2 py-1.5 pointer-events-none">
        {[
          { label: 'Canal',      dash: '2 4'     },
          { label: 'Rail',       dash: '8 4'     },
          { label: 'Canal/Rail', dash: '8 4 2 4' },
        ].map(({ label, dash }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="28" height="8">
              <line x1="0" y1="4" x2="28" y2="4" stroke="#a8a29e" strokeWidth="2" strokeDasharray={dash} />
            </svg>
            <span className="text-[10px] text-stone-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1">
        <button
          onClick={() => setVb(prev => {
            const factor = 1 / 1.3
            const cx = prev.x + prev.w / 2
            const cy = prev.y + prev.h / 2
            const newW = prev.w * factor
            const newH = prev.h * factor
            if (newW / DEFAULT_VB.w < MIN_ZOOM) return prev
            return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH }
          })}
          className="w-8 h-8 bg-stone-800/80 hover:bg-stone-700 border border-stone-600 text-stone-300 rounded flex items-center justify-center text-lg leading-none"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setVb(prev => {
            const factor = 1.3
            const cx = prev.x + prev.w / 2
            const cy = prev.y + prev.h / 2
            const newW = prev.w * factor
            const newH = prev.h * factor
            if (newW / DEFAULT_VB.w > MAX_ZOOM) return prev
            return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH }
          })}
          className="w-8 h-8 bg-stone-800/80 hover:bg-stone-700 border border-stone-600 text-stone-300 rounded flex items-center justify-center text-lg leading-none"
          title="Zoom out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 bg-stone-800/80 hover:bg-stone-700 border border-stone-600 text-stone-300 rounded flex items-center justify-center text-xs leading-none"
          title="Reset view"
        >
          R
        </button>
      </div>
    </div>
  )
}

function buildValidLocationSet (selectedAction, cardObj, gameState) {
  if (selectedAction !== 'build' || !cardObj) return null
  if (cardObj.type === 'wildLocation' || cardObj.type === 'wildIndustry') return null

  if (cardObj.type === 'location') {
    return new Set([cardObj.locationId])
  }

  if (cardObj.type === 'industry') {
    const valid = new Set()
    for (const [locId, boardLoc] of Object.entries(gameState.board.locations)) {
      const hasSlot = boardLoc.slots.some(
        s => s.tileId === null && (s.allowedIndustries || []).includes(cardObj.industry)
      )
      if (hasSlot) valid.add(locId)
    }
    return valid
  }

  return null
}

function formatLocationName (id) {
  const names = {
    stokeOnTrent: 'Stoke-on-Trent',
    burtonOnTrent: 'Burton-on-Trent',
    coalbrookdale: 'Coalbrookdale',
    wolverhampton: 'Wolverhampton',
    kidderminster: 'Kidderminster',
    farmBrewery1: 'Farm Brewery',
    farmBrewery2: 'Farm Brewery',
    shrewsbury: 'Shrewsbury',
    gloucester: 'Gloucester',
    warrington: 'Warrington',
    nuneaton: 'Nuneaton',
    redditch: 'Redditch',
    tamworth: 'Tamworth',
    cannock: 'Cannock',
    stafford: 'Stafford',
    uttoxeter: 'Uttoxeter',
    walsall: 'Walsall',
    dudley: 'Dudley',
    coventry: 'Coventry',
    worcester: 'Worcester',
    birmingham: 'Birmingham',
    nottingham: 'Nottingham',
    belper: 'Belper',
    derby: 'Derby',
    leek: 'Leek',
    stone: 'Stone',
    oxford: 'Oxford',
  }
  return names[id] || id.charAt(0).toUpperCase() + id.slice(1)
}
