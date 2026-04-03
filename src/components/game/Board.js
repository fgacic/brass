'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

const LOCATION_POSITIONS = {
  leek: { x: 340, y: 40 },
  stokeOnTrent: { x: 260, y: 100 },
  stone: { x: 200, y: 160 },
  uttoxeter: { x: 350, y: 150 },
  stafford: { x: 160, y: 230 },
  burtonOnTrent: { x: 380, y: 230 },
  cannock: { x: 220, y: 310 },
  tamworth: { x: 410, y: 310 },
  wolverhampton: { x: 140, y: 380 },
  walsall: { x: 250, y: 380 },
  coalbrookdale: { x: 60, y: 380 },
  dudley: { x: 140, y: 450 },
  birmingham: { x: 280, y: 460 },
  nuneaton: { x: 430, y: 390 },
  coventry: { x: 480, y: 460 },
  kidderminster: { x: 80, y: 530 },
  redditch: { x: 230, y: 540 },
  worcester: { x: 120, y: 600 },
  farmBrewery1: { x: 160, y: 300 },
  farmBrewery2: { x: 60, y: 570 },
  derby: { x: 460, y: 150 },
  belper: { x: 430, y: 80 },
  nottingham: { x: 540, y: 180 },
  shrewsbury: { x: 10, y: 320 },
  gloucester: { x: 80, y: 670 },
  oxford: { x: 400, y: 570 },
  warrington: { x: 180, y: 10 },
  merchantNottingham: { x: 600, y: 140 },
}

const PLAYER_COLORS = {
  red: '#ef4444',
  yellow: '#eab308',
  purple: '#a855f7',
  white: '#e7e5e4',
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

const DEFAULT_VB = { x: -20, y: -20, w: 660, h: 720 }
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const DRAG_THRESHOLD = 4

function parseConnectionEndpoints (connId) {
  const knownLocations = Object.keys(LOCATION_POSITIONS)
  for (const loc of knownLocations) {
    if (connId.startsWith(loc + '-')) {
      const rest = connId.slice(loc.length + 1)
      const other = knownLocations.find(l => rest === l || rest.startsWith(l))
      if (other) return [loc, other]
    }
  }
  return null
}

export function Board ({ gameState, playerId }) {
  const { targetingMode, selectedTargets, addTarget } = useGameStore()
  const svgRef = useRef(null)
  const [vb, setVb] = useState({ ...DEFAULT_VB })
  const panRef = useRef({ active: false, hasDragged: false, startX: 0, startY: 0, startVb: null })
  const pinchRef = useRef({ dist: 0 })

  const selectedLocationId = selectedTargets.find(t => t.type === 'location')?.id || null
  const selectedConnectionIds = new Set(selectedTargets.filter(t => t.type === 'connection').map(t => t.id))

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

          const ownerColor = isBuilt
            ? PLAYER_COLORS[gameState.players.find(p => p.id === link.ownerId)?.color] || '#555'
            : '#44403c'

          const dx = toPos.x - fromPos.x
          const dy = toPos.y - fromPos.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const offset = isDuplicate ? 6 : 0
          const nx = -dy / len * offset
          const ny = dx / len * offset

          return (
            <g key={connId}>
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
                stroke={isSelected ? '#f59e0b' : ownerColor}
                strokeWidth={isSelected ? 5 : isBuilt ? 4 : 2}
                strokeDasharray={isBuilt || isSelected ? 'none' : '4 4'}
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
          const isMerchant = ['shrewsbury', 'gloucester', 'oxford', 'warrington', 'merchantNottingham'].includes(locId)
          const isFarm = locId.startsWith('farmBrewery')
          const isSelected = selectedLocationId === locId
          const isTargetable = targetingMode === 'location' && !isMerchant

          const boardLoc = gameState.board.locations[locId]
          const tilesHere = gameState.industryTilesOnBoard.filter(t => t.locationId === locId)
          const baseR = isMerchant ? 14 : isFarm ? 12 : 18
          const r = isSelected ? baseR + 3 : baseR

          const slots = boardLoc?.slots || []
          const emptySlots = slots.filter(s => s.tileId === null)

          return (
            <g key={locId}
              onClick={(e) => isTargetable && handleLocationClick(e, locId)}
              className={isTargetable ? 'cursor-pointer' : ''}
            >
              {/* Transparent hit area for easier clicking */}
              {isTargetable && (
                <circle cx={pos.x} cy={pos.y} r={baseR + 6} fill="transparent" />
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

              {/* Industry slot icons for empty slots */}
              {!isMerchant && emptySlots.length > 0 && (
                <g pointerEvents="none">
                  {emptySlots.map((slot, idx) => {
                    const totalEmpty = emptySlots.length
                    const slotWidth = Math.min(12, 40 / Math.max(totalEmpty, 1))
                    const totalWidth = totalEmpty * slotWidth
                    const sx = pos.x - totalWidth / 2 + idx * slotWidth + slotWidth / 2
                    const sy = pos.y - r - 8

                    const industries = slot.allowedIndustries || []

                    if (industries.length === 1) {
                      return (
                        <g key={`slot-${locId}-${idx}`}>
                          <circle cx={sx} cy={sy} r={5} fill={INDUSTRY_COLORS[industries[0]] || '#555'} stroke="#44403c" strokeWidth={0.5} />
                          <text x={sx} y={sy + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="5" fontWeight="bold">
                            {INDUSTRY_LETTERS[industries[0]] || '?'}
                          </text>
                        </g>
                      )
                    }

                    return (
                      <g key={`slot-${locId}-${idx}`}>
                        <rect x={sx - 5.5} y={sy - 5} width={11} height={10} rx={2} fill="#292524" stroke="#44403c" strokeWidth={0.5} />
                        {industries.map((ind, j) => {
                          const ix = sx - 3 + j * 6
                          return (
                            <g key={`${locId}-${idx}-${j}`}>
                              <circle cx={ix} cy={sy} r={3.5} fill={INDUSTRY_COLORS[ind] || '#555'} />
                              <text x={ix} y={sy + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="4" fontWeight="bold">
                                {INDUSTRY_LETTERS[ind] || '?'}
                              </text>
                            </g>
                          )
                        })}
                      </g>
                    )
                  })}
                </g>
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
              <text
                x={pos.x} y={pos.y + (isMerchant ? 22 : 28)}
                textAnchor="middle"
                fill={isSelected ? '#fbbf24' : '#a8a29e'}
                fontSize={isSelected ? 9 : 8}
                fontWeight={isSelected ? 'bold' : 'normal'}
                pointerEvents="none"
              >
                {formatLocationName(locId)}
              </text>
            </g>
          )
        })}

        {/* Merchant beer indicators */}
        {Object.entries(gameState.board.merchants || {}).map(([locId, merchant]) => {
          const pos = LOCATION_POSITIONS[locId]
          if (!pos) return null
          return (
            <g key={`merchant-${locId}`}>
              {merchant.beerAvailable && (
                <circle cx={pos.x + 16} cy={pos.y - 10} r={4} fill="#ca8a04" stroke="#fbbf24" strokeWidth={1} pointerEvents="none" />
              )}
            </g>
          )
        })}
      </svg>

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

function formatLocationName (id) {
  const names = {
    stokeOnTrent: 'Stoke',
    burtonOnTrent: 'Burton',
    coalbrookdale: 'C.dale',
    wolverhampton: 'Wolves',
    kidderminster: 'Kidder.',
    farmBrewery1: 'Farm',
    farmBrewery2: 'Farm',
    merchantNottingham: 'Nott. M',
    shrewsbury: 'Shrews.',
    gloucester: 'Glouc.',
    warrington: 'Warr.',
  }
  return names[id] || id.charAt(0).toUpperCase() + id.slice(1)
}
