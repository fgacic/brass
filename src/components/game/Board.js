'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { LOCATION_POSITIONS } from '@/game/data/board-location-positions'
import {
  PLAYER_COLOR_HEX as PLAYER_COLORS,
  INDUSTRY_COLOR_HEX as INDUSTRY_COLORS,
  INDUSTRY_LETTER as INDUSTRY_LETTERS,
  INDUSTRY_LABEL,
  INDUSTRY_LEGEND_ORDER,
} from './boardTheme'
import { m, useReducedMotion } from './motionConfig'
import { computeSlotGridGeometry } from './boardSlotGrid'
import { industryDefinitions } from '@/game/data/industries'


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
  'worcester-gloucester':          { canal: true,  rail: true  },
  'worcester-birmingham':          { canal: true,  rail: true  },
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

function dedupeTiersByLevel (tilesPerPlayer) {
  const byLevel = new Map()
  for (const row of tilesPerPlayer || []) {
    if (!byLevel.has(row.level)) byLevel.set(row.level, row)
  }
  return Array.from(byLevel.values()).sort((a, b) => a.level - b.level)
}

function formatBuildCostResourceSuffix (row) {
  const parts = []
  if (row.coalCost > 0) parts.push(`${row.coalCost}K`)
  if (row.ironCost > 0) parts.push(`${row.ironCost}I`)
  if ((row.beerCost || 0) > 0) parts.push(`${row.beerCost}B`)
  return parts.length ? ` · ${parts.join(' ')}` : ''
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

const MERCHANT_TRIPLE_INDUSTRIES = ['cottonMill', 'manufacturer', 'pottery']

function isTripleMerchantDemand (acceptedIndustries) {
  const acc = acceptedIndustries || []
  if (acc.length !== 3) return false
  const set = new Set(acc)
  return MERCHANT_TRIPLE_INDUSTRIES.every((id) => set.has(id))
}

/** SVG path for a pie wedge: center (cx,cy), radius r, start angle deg, sweep deg (clockwise). */
function pieSectorPath (cx, cy, r, startDeg, sweepDeg) {
  const rad = Math.PI / 180
  const x1 = cx + r * Math.cos(startDeg * rad)
  const y1 = cy + r * Math.sin(startDeg * rad)
  const x2 = cx + r * Math.cos((startDeg + sweepDeg) * rad)
  const y2 = cy + r * Math.sin((startDeg + sweepDeg) * rad)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

function labelAtPolar (cx, cy, dist, deg) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) }
}

/**
 * Foreign-market demand badges: single-industry circles or one triple-demand pie (C/M/P).
 * One merchant beer per demand strip, drawn under that strip’s icon. Uses SVG title for tooltips.
 */
function renderMerchantDemandBadges (pos, baseR, slots, keyPrefix) {
  if (!slots.length) return null
  const pieR = 10
  const singleR = 9
  const beerR = 3.2
  const gapBelowBadge = 4

  return (
    <g>
      {slots.map((slot, idx) => {
        const total = slots.length
        const spreadDeg = total === 1 ? 0 : total === 2 ? 60 : total === 3 ? 55 : 42
        const startDeg = -90 - spreadDeg * (total - 1) / 2
        const angleDeg = startDeg + idx * spreadDeg
        const angleRad = angleDeg * Math.PI / 180
        const orbitR = baseR + 20
        const cx = pos.x + Math.cos(angleRad) * orbitR
        const cy = pos.y + Math.sin(angleRad) * orbitR
        const beerRemaining = slot.beerRemaining ?? 0
        const hasBeer = beerRemaining > 0

        if (slot.demandKind === 'tripleForeign') {
          const c = INDUSTRY_COLORS.cottonMill || '#3b82f6'
          const m = INDUSTRY_COLORS.manufacturer || '#8b5cf6'
          const p = INDUSTRY_COLORS.pottery || '#14b8a6'
          const w = labelAtPolar(cx, cy, 5.2, -30)
          const wM = labelAtPolar(cx, cy, 5.2, 90)
          const wP = labelAtPolar(cx, cy, 5.2, 210)
          const beerY = cy + pieR + gapBelowBadge + beerR
          return (
            <g key={`${keyPrefix}-${idx}`} pointerEvents="all" cursor="help">
              <title>
                {`Foreign market: cotton, manufacturer, pottery. Beer for this strip: ${hasBeer ? 'available' : 'sold'}.`}
              </title>
              <circle cx={cx} cy={cy} r={pieR + 3} fill="transparent" />
              <path d={pieSectorPath(cx, cy, pieR, -90, 120)} fill={c} stroke="#1c1917" strokeWidth={1.2} />
              <path d={pieSectorPath(cx, cy, pieR, 30, 120)} fill={m} stroke="#1c1917" strokeWidth={1.2} />
              <path d={pieSectorPath(cx, cy, pieR, 150, 120)} fill={p} stroke="#1c1917" strokeWidth={1.2} />
              <circle cx={cx} cy={cy} r={pieR} fill="none" stroke="#1c1917" strokeWidth={1.5} />
              <text x={w.x} y={w.y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6" fontWeight="bold" pointerEvents="none">
                {INDUSTRY_LETTERS.cottonMill}
              </text>
              <text x={wM.x} y={wM.y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6" fontWeight="bold" pointerEvents="none">
                {INDUSTRY_LETTERS.manufacturer}
              </text>
              <text x={wP.x} y={wP.y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6" fontWeight="bold" pointerEvents="none">
                {INDUSTRY_LETTERS.pottery}
              </text>
              <circle
                cx={cx}
                cy={beerY}
                r={beerR}
                fill={hasBeer ? '#ca8a04' : 'none'}
                stroke="#fbbf24"
                strokeWidth={0.85}
                opacity={hasBeer ? 1 : 0.4}
                pointerEvents="none"
              />
            </g>
          )
        }

        const ind = slot.allowedIndustries?.[0]
        if (!ind) return null
        const label = INDUSTRY_LABEL[ind] || ind
        const beerY = cy + singleR + gapBelowBadge + beerR
        return (
          <g key={`${keyPrefix}-${idx}`} pointerEvents="all" cursor="help">
            <title>{`Foreign market: ${label}. Beer for this strip: ${hasBeer ? 'available' : 'sold'}.`}</title>
            <circle cx={cx} cy={cy} r={12} fill="transparent" />
            <circle cx={cx} cy={cy} r={singleR} fill={INDUSTRY_COLORS[ind] || '#555'} stroke="#1c1917" strokeWidth={1.5} />
            <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="bold" pointerEvents="none">
              {INDUSTRY_LETTERS[ind] || '?'}
            </text>
            <circle
              cx={cx}
              cy={beerY}
              r={beerR}
              fill={hasBeer ? '#ca8a04' : 'none'}
              stroke="#fbbf24"
              strokeWidth={0.85}
              opacity={hasBeer ? 1 : 0.4}
              pointerEvents="none"
            />
          </g>
        )
      })}
    </g>
  )
}

const PAIRING_STROKE = '#38bdf8'

function renderSlotGridEmptyCell ({ keyPrefix, cx, cy, x, y, size, industries, pairingIndustry = null }) {
  if (!industries.length) return null
  if (industries.length === 1) {
    const ind = industries[0]
    const showPair = pairingIndustry && pairingIndustry === ind
    return (
      <g key={keyPrefix} pointerEvents="none">
        <rect
          x={x} y={y} width={size} height={size} rx={2}
          fill="#131110" stroke="#57534e" strokeWidth={1.2}
        />
        <rect
          x={x + 2} y={y + 2} width={size - 4} height={size - 4} rx={1}
          fill={INDUSTRY_COLORS[ind] || '#555'} opacity={0.88}
        />
        {showPair && (
          <rect
            x={x + 1.5} y={y + 1.5} width={size - 3} height={size - 3} rx={1.5}
            fill="none" stroke={PAIRING_STROKE} strokeWidth={2} opacity={0.92}
          >
            <animate attributeName="opacity" values="0.55;1;0.55" dur="1.6s" repeatCount="indefinite" />
          </rect>
        )}
        <text
          x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="8" fontWeight="bold"
        >
          {INDUSTRY_LETTERS[ind] || '?'}
        </text>
      </g>
    )
  }
  const [ind0, ind1] = industries
  const mid = x + size / 2
  const pairLeft = pairingIndustry && pairingIndustry === ind0
  const pairRight = pairingIndustry && pairingIndustry === ind1
  const dLeft = `M ${x} ${y} L ${mid} ${y} L ${mid} ${y + size} L ${x} ${y + size} Z`
  const dRight = `M ${mid} ${y} L ${x + size} ${y} L ${x + size} ${y + size} L ${mid} ${y + size} Z`
  return (
    <g key={keyPrefix} pointerEvents="none">
      <rect
        x={x} y={y} width={size} height={size} rx={2}
        fill="#131110" stroke="#57534e" strokeWidth={1.2}
      />
      <path
        d={dLeft}
        fill={INDUSTRY_COLORS[ind0] || '#555'}
        opacity={0.9}
      />
      <path
        d={dRight}
        fill={INDUSTRY_COLORS[ind1] || '#555'}
        opacity={0.9}
      />
      <line x1={mid} y1={y} x2={mid} y2={y + size} stroke="#1c1917" strokeWidth={1} />
      {pairLeft && (
        <path
          d={dLeft}
          fill="none"
          stroke={PAIRING_STROKE}
          strokeWidth={2}
          strokeLinejoin="miter"
          opacity={0.92}
        >
          <animate attributeName="opacity" values="0.55;1;0.55" dur="1.6s" repeatCount="indefinite" />
        </path>
      )}
      {pairRight && (
        <path
          d={dRight}
          fill="none"
          stroke={PAIRING_STROKE}
          strokeWidth={2}
          strokeLinejoin="miter"
          opacity={0.92}
        >
          <animate attributeName="opacity" values="0.55;1;0.55" dur="1.6s" repeatCount="indefinite" />
        </path>
      )}
      <text
        x={cx - 3.5} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="7" fontWeight="bold"
      >
        {INDUSTRY_LETTERS[ind0] || '?'}
      </text>
      <text
        x={cx + 3.5} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="7" fontWeight="bold"
      >
        {INDUSTRY_LETTERS[ind1] || '?'}
      </text>
    </g>
  )
}

export function Board ({ gameState, playerId, boardFx = null }) {
  const { targetingMode, selectedTargets, addTarget, setLocationTarget, selectedAction, selectedCard, buildIndustry } = useGameStore()
  const reduceMotion = useReducedMotion()
  const svgRef = useRef(null)
  const [vb, setVb] = useState({ ...DEFAULT_VB })
  const panRef = useRef({ active: false, hasDragged: false, startX: 0, startY: 0, startVb: null })
  const pinchRef = useRef({ dist: 0 })

  const selectedLocationId = selectedTargets.find(t => t.type === 'location')?.id || null
  const selectedConnectionIds = new Set(selectedTargets.filter(t => t.type === 'connection').map(t => t.id))

  const myPlayer = gameState.players.find(p => p.id === playerId)
  const selectedCardObj = myPlayer?.hand?.find(c => c.id === selectedCard) || null
  const buildValidLocations = buildValidLocationSet(selectedAction, selectedCardObj, gameState, buildIndustry)

  const buildPairingIndustry =
    selectedAction === 'build' && targetingMode === 'location'
      ? (buildIndustry || (selectedCardObj?.type === 'industry' ? selectedCardObj.industry : null))
      : null

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

  useEffect(() => {
    if (selectedAction !== 'build' || targetingMode !== 'location') return
    if (!selectedCardObj || selectedCardObj.type !== 'location' || !selectedCardObj.locationId) return
    const pos = LOCATION_POSITIONS[selectedCardObj.locationId]
    if (!pos) return

    setLocationTarget(selectedCardObj.locationId)
    setVb(prev => ({
      x: pos.x - prev.w / 2,
      y: pos.y - prev.h / 2,
      w: prev.w,
      h: prev.h,
    }))
  }, [selectedAction, targetingMode, selectedCard, selectedCardObj?.locationId, selectedCardObj?.type, setLocationTarget])

  const drawnPairs = new Set()
  const tileFlipSet = new Set(boardFx?.tileFlipIds || [])

  const [legendHeldHover, setLegendHeldHover] = useState(false)
  const legendHoldTimerRef = useRef(null)

  const clearLegendHoldTimer = useCallback(() => {
    if (legendHoldTimerRef.current) {
      clearTimeout(legendHoldTimerRef.current)
      legendHoldTimerRef.current = null
    }
  }, [])

  const onLegendPointerEnter = useCallback(() => {
    clearLegendHoldTimer()
    legendHoldTimerRef.current = setTimeout(() => {
      setLegendHeldHover(true)
      legendHoldTimerRef.current = null
    }, 1000)
  }, [clearLegendHoldTimer])

  const onLegendPointerLeave = useCallback(() => {
    clearLegendHoldTimer()
    setLegendHeldHover(false)
  }, [clearLegendHoldTimer])

  useEffect(() => () => clearLegendHoldTimer(), [clearLegendHoldTimer])

  return (
    <div className="relative w-full h-full overflow-visible">
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
          const linkJustBuilt = isBuilt && boardFx?.linkDrawId === connId

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
              <m.line
                x1={fromPos.x + nx} y1={fromPos.y + ny}
                x2={toPos.x + nx} y2={toPos.y + ny}
                stroke={isSelected ? '#f59e0b' : isBuilt ? ownerColor : style.stroke}
                strokeWidth={isSelected ? 5 : isBuilt ? 4 : style.width}
                strokeDasharray={isSelected ? 'none' : isBuilt ? 'none' : style.dash}
                pointerEvents="none"
                initial={
                  linkJustBuilt && !reduceMotion
                    ? { opacity: 0.4, strokeWidth: 2 }
                    : false
                }
                animate={{
                  opacity: 1,
                  strokeWidth: isSelected ? 5 : isBuilt ? 4 : style.width,
                }}
                transition={
                  linkJustBuilt && !reduceMotion
                    ? { duration: 0.45, ease: 'easeOut' }
                    : { duration: 0 }
                }
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

        {/* Farm brewery (Kidderminster–Worcester): T-stem — same selection/hit as trunk id */}
        {(() => {
          const kPos = LOCATION_POSITIONS.kidderminster
          const wPos = LOCATION_POSITIONS.worcester
          const fPos = LOCATION_POSITIONS.farmBrewery2
          if (!kPos || !wPos || !fPos) return null
          const midX = (kPos.x + wPos.x) / 2
          const midY = (kPos.y + wPos.y) / 2
          const trunkId = 'kidderminster-worcester'
          const kwLink = gameState.board.links[trunkId]
          const meta = CONNECTION_META[trunkId] || { canal: true, rail: true }
          const era = gameState.era
          const isWrongEra = (era === 'canal' && !meta.canal) || (era === 'rail' && !meta.rail)
          const isBuilt = kwLink?.ownerId != null
          const linkJustBuiltStem = isBuilt && boardFx?.linkDrawId === trunkId
          const isSelected = selectedConnectionIds.has(trunkId)
          const isTargetable = targetingMode === 'connection' && !isBuilt
          const linkType = meta.canal && meta.rail ? 'both' : meta.canal ? 'canal' : 'rail'
          const style = LINK_STYLE[linkType]
          const ownerColor = isBuilt
            ? PLAYER_COLORS[gameState.players.find(p => p.id === kwLink.ownerId)?.color] || '#888'
            : style.stroke
          const strokeColor = isSelected ? '#f59e0b' : isBuilt ? ownerColor : style.stroke
          const strokeW = isSelected ? 5 : isBuilt ? 4 : style.width
          const dash = isSelected ? 'none' : isBuilt ? 'none' : style.dash
          return (
            <g key="farmBrewery2-trunk-stem" opacity={!isBuilt && isWrongEra ? 0.25 : 1}>
              {isTargetable && (
                <line
                  x1={fPos.x}
                  y1={fPos.y}
                  x2={midX}
                  y2={midY}
                  stroke="transparent"
                  strokeWidth={16}
                  className="cursor-pointer"
                  onClick={(e) => handleConnectionClick(e, trunkId)}
                />
              )}
              <m.line
                x1={fPos.x}
                y1={fPos.y}
                x2={midX}
                y2={midY}
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeDasharray={dash}
                pointerEvents="none"
                initial={
                  linkJustBuiltStem && !reduceMotion
                    ? { opacity: 0.4, strokeWidth: 2 }
                    : false
                }
                animate={{
                  opacity: 1,
                  strokeWidth: strokeW,
                }}
                transition={
                  linkJustBuiltStem && !reduceMotion
                    ? { duration: 0.45, ease: 'easeOut' }
                    : { duration: 0 }
                }
              />
              {isSelected && (
                <line
                  x1={fPos.x}
                  y1={fPos.y}
                  x2={midX}
                  y2={midY}
                  stroke="#fbbf24"
                  strokeWidth={7}
                  opacity={0.3}
                  pointerEvents="none"
                >
                  <animate attributeName="opacity" values="0.15;0.45;0.15" dur="1.5s" repeatCount="indefinite" />
                </line>
              )}
            </g>
          )
        })()}

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
            ? (merchantData.demandSlots || []).map((slot) => {
              const acc = slot.acceptedIndustries || []
              const beerRemaining = slot.merchantBeerRemaining ?? 0
              if (isTripleMerchantDemand(acc)) {
                return { demandKind: 'tripleForeign', allowedIndustries: acc, beerRemaining }
              }
              if (acc.length === 0) return null
              return { demandKind: 'single', allowedIndustries: [acc[0]], beerRemaining }
            }).filter(Boolean)
            : []

          const useSlotGrid = !isMerchant && slots.length > 0
          const slotGridGeo = useSlotGrid ? computeSlotGridGeometry(pos, slots.length) : null
          const displayName = formatLocationName(locId)
          const nameLines = displayName.split('-')
          const SLOT_LABEL_GAP = 6
          const SLOT_HIT_PAD = 6
          const SLOT_HIGHLIGHT_PAD = 4
          let slotHitBbox = null
          let slotHighlightBbox = null
          if (slotGridGeo) {
            const labelH = nameLines.length * 9
            slotHighlightBbox = {
              x: slotGridGeo.gridLeft - SLOT_HIGHLIGHT_PAD,
              y: slotGridGeo.gridTop - SLOT_HIGHLIGHT_PAD,
              w: slotGridGeo.gridWidth + 2 * SLOT_HIGHLIGHT_PAD,
              h: slotGridGeo.gridHeight + 2 * SLOT_HIGHLIGHT_PAD,
            }
            slotHitBbox = {
              x: slotGridGeo.gridLeft - SLOT_HIT_PAD,
              y: slotGridGeo.gridTop - SLOT_HIT_PAD,
              w: slotGridGeo.gridWidth + 2 * SLOT_HIT_PAD,
              h: slotGridGeo.gridHeight + SLOT_LABEL_GAP + labelH + 2 * SLOT_HIT_PAD,
            }
          }

          return (
            <g key={locId}
              onClick={(e) => isTargetable && handleLocationClick(e, locId)}
              className={isTargetable ? 'cursor-pointer' : ''}
            >
              {useSlotGrid && slotGridGeo && slotHitBbox && slotHighlightBbox && (
                <>
                  <g pointerEvents="none">
                    {slotGridGeo.cells.map((cell) => {
                      const slot = slots[cell.slotIndex]
                      if (!slot) return null
                      const tile = slot.tileId
                        ? tilesHere.find((t) => t.id === slot.tileId) ||
                          tilesHere.find((t) => t.slotIndex === cell.slotIndex)
                        : null
                      const { cx, cy, x, y, size } = cell
                      if (tile) {
                        const ownerPlayer = gameState.players.find((p) => p.id === tile.ownerId)
                        const outlineColor = ownerPlayer ? PLAYER_COLORS[ownerPlayer.color] : '#555'
                        const tilePop = boardFx?.tilePopId === tile.id
                        const tileFlip = tileFlipSet.has(tile.id)
                        const tileMotionInitial =
                          tilePop && !reduceMotion ? { scale: 0.65, opacity: 0.88 } : false
                        const tileMotionAnimate =
                          tilePop && !reduceMotion
                            ? { scale: [0.65, 1.09, 1], opacity: 1, scaleY: 1 }
                            : tileFlip && !reduceMotion
                              ? { scale: 1, opacity: 1, scaleY: [1, 0.82, 1] }
                              : { scale: 1, opacity: 1, scaleY: 1 }
                        const tileMotionTransition =
                          tilePop && !reduceMotion
                            ? { duration: 0.55, ease: 'easeOut' }
                            : tileFlip && !reduceMotion
                              ? { duration: 0.5, ease: 'easeInOut' }
                              : { duration: 0 }
                        return (
                          <g key={tile.id} transform={`translate(${cx}, ${cy})`}>
                            <m.g
                              layoutId={tilePop ? 'brass-build-pending' : undefined}
                              style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}
                              initial={tileMotionInitial}
                              animate={tileMotionAnimate}
                              transition={tileMotionTransition}
                            >
                              <rect
                                x={-size / 2}
                                y={-size / 2}
                                width={size}
                                height={size}
                                rx={2}
                                fill={tile.isFlipped ? '#1a1a1a' : INDUSTRY_COLORS[tile.industry] || '#555'}
                                stroke={outlineColor}
                                strokeWidth={1.5}
                              />
                              <text
                                x={0}
                                y={1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="8"
                                fontWeight="bold"
                                pointerEvents="none"
                              >
                                {tile.level}
                              </text>
                              {tile.resourcesRemaining > 0 && (
                                <text
                                  x={size / 2 - 2}
                                  y={-size / 2 + 4}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#fbbf24"
                                  fontSize="6"
                                  fontWeight="bold"
                                  pointerEvents="none"
                                >
                                  {tile.resourcesRemaining}
                                </text>
                              )}
                            </m.g>
                          </g>
                        )
                      }
                      return renderSlotGridEmptyCell({
                        keyPrefix: `slot-${locId}-${cell.slotIndex}`,
                        cx,
                        cy,
                        x,
                        y,
                        size,
                        industries: slot.allowedIndustries || [],
                        pairingIndustry: buildPairingIndustry,
                      })
                    })}
                  </g>
                  <g pointerEvents="none">
                    {nameLines.map((part, i) => (
                      <text
                        key={i}
                        x={pos.x}
                        y={slotGridGeo.gridTop + slotGridGeo.gridHeight + SLOT_LABEL_GAP + 9 + i * 9}
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
                  {isSelected && (
                    <rect
                      x={slotHighlightBbox.x}
                      y={slotHighlightBbox.y}
                      width={slotHighlightBbox.w}
                      height={slotHighlightBbox.h}
                      rx={6}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      opacity={0.85}
                      pointerEvents="none"
                    >
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                    </rect>
                  )}
                  {isTargetable && !isSelected && (
                    <rect
                      x={slotHighlightBbox.x}
                      y={slotHighlightBbox.y}
                      width={slotHighlightBbox.w}
                      height={slotHighlightBbox.h}
                      rx={6}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      opacity={0.8}
                      pointerEvents="none"
                    >
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}
                  {isTargetable && (
                    <rect
                      x={slotHitBbox.x}
                      y={slotHitBbox.y}
                      width={slotHitBbox.w}
                      height={slotHitBbox.h}
                      rx={8}
                      fill="transparent"
                      pointerEvents="all"
                    />
                  )}
                </>
              )}

              {!useSlotGrid && (
                <>
                  {isTargetable && (
                    <circle cx={pos.x} cy={pos.y} r={baseR + 30} fill="transparent" />
                  )}
                  {isSelected && (
                    <circle cx={pos.x} cy={pos.y} r={r + 4} fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.8}>
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isTargetable && !isSelected && (
                    <circle cx={pos.x} cy={pos.y} r={baseR + 4} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" opacity={0.8}>
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={isSelected ? '#451a03' : isMerchant ? '#78350f' : isFarm ? '#365314' : '#292524'}
                    stroke={isSelected ? '#f59e0b' : isMerchant ? '#d97706' : isFarm ? '#65a30d' : '#57534e'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {isMerchant && merchantDemandSlots.length > 0 &&
                    renderMerchantDemandBadges(pos, baseR, merchantDemandSlots, `merch-${locId}`)}
                  {tilesHere.map((tile, idx) => {
                    const angle = (idx * 2 * Math.PI) / Math.max(tilesHere.length, 1) - Math.PI / 2
                    const radius = tilesHere.length > 1 ? 10 : 0
                    const tx = pos.x + Math.cos(angle) * radius
                    const ty = pos.y + Math.sin(angle) * radius

                    const ownerPlayer = gameState.players.find(p => p.id === tile.ownerId)
                    const outlineColor = ownerPlayer ? PLAYER_COLORS[ownerPlayer.color] : '#555'
                    const tilePop = boardFx?.tilePopId === tile.id
                    const tileFlip = tileFlipSet.has(tile.id)
                    const tileMotionInitial =
                      tilePop && !reduceMotion ? { scale: 0.65, opacity: 0.88 } : false
                    const tileMotionAnimate =
                      tilePop && !reduceMotion
                        ? { scale: [0.65, 1.09, 1], opacity: 1, scaleY: 1 }
                        : tileFlip && !reduceMotion
                          ? { scale: 1, opacity: 1, scaleY: [1, 0.82, 1] }
                          : { scale: 1, opacity: 1, scaleY: 1 }
                    const tileMotionTransition =
                      tilePop && !reduceMotion
                        ? { duration: 0.55, ease: 'easeOut' }
                        : tileFlip && !reduceMotion
                          ? { duration: 0.5, ease: 'easeInOut' }
                          : { duration: 0 }

                    return (
                      <g key={tile.id} transform={`translate(${tx}, ${ty})`}>
                        <m.g
                          layoutId={tilePop ? 'brass-build-pending' : undefined}
                          style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}
                          initial={tileMotionInitial}
                          animate={tileMotionAnimate}
                          transition={tileMotionTransition}
                        >
                          <rect
                            x={-7} y={-7} width={14} height={14} rx={2}
                            fill={tile.isFlipped ? '#1a1a1a' : INDUSTRY_COLORS[tile.industry] || '#555'}
                            stroke={outlineColor} strokeWidth={1.5}
                          />
                          <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="bold" pointerEvents="none">
                            {tile.level}
                          </text>
                          {tile.resourcesRemaining > 0 && (
                            <text x={6} y={-6} textAnchor="middle" dominantBaseline="middle" fill="#fbbf24" fontSize="6" fontWeight="bold" pointerEvents="none">
                              {tile.resourcesRemaining}
                            </text>
                          )}
                        </m.g>
                      </g>
                    )
                  })}
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
                </>
              )}
            </g>
          )
        })}
      </svg>

      {/* Link type legend */}
      <div className="pointer-events-none absolute top-2 left-2 flex flex-col gap-1 rounded-lg border border-amber-900/30 bg-[#14100e]/92 px-2.5 py-2 shadow-lg shadow-black/40 backdrop-blur-sm ring-1 ring-white/5">
        {[
          { label: 'Canal',      dash: '2 4'     },
          { label: 'Rail',       dash: '8 4'     },
          { label: 'Canal/Rail', dash: '8 4 2 4' },
        ].map(({ label, dash }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="28" height="8">
              <line x1="0" y1="4" x2="28" y2="4" stroke="#a8a29e" strokeWidth="2" strokeDasharray={dash} />
            </svg>
            <span className="text-[10px] font-medium text-amber-100/55">{label}</span>
          </div>
        ))}
      </div>

      {/* Industry letters + merchant notes — hold pointer 1s here to enlarge (Motion) */}
      <m.div
        className="absolute top-2 right-2 z-20 flex max-h-[min(50vh,320px)] w-fit cursor-pointer flex-col gap-1 overflow-y-auto rounded-lg border border-amber-900/30 bg-[#14100e]/92 px-2 py-1.5 backdrop-blur-sm ring-1 ring-white/5"
        style={{ transformOrigin: 'top right' }}
        title="Hold pointer here for 1 second to enlarge the legend"
        onPointerEnter={onLegendPointerEnter}
        onPointerLeave={onLegendPointerLeave}
        animate={{
          scale: reduceMotion ? 1 : (legendHeldHover ? 1.5 : 1),
          boxShadow: reduceMotion
            ? '0 10px 15px -3px rgba(0,0,0,0.45), 0 4px 6px -4px rgba(0,0,0,0.35)'
            : legendHeldHover
              ? '0 25px 50px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(251,191,36,0.12)'
              : '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.35)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.72 }}
      >
        <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200/45">
          Industries
        </span>
        {INDUSTRY_LEGEND_ORDER.map((id) => (
          <div key={id} className="flex w-max items-center gap-1.5">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/40 text-[9px] font-bold text-white shadow-sm"
              style={{ backgroundColor: INDUSTRY_COLORS[id] }}
            >
              {INDUSTRY_LETTERS[id]}
            </span>
            <span className="whitespace-nowrap text-[10px] font-medium text-[#ddd6cc]">
              {INDUSTRY_LABEL[id]}
            </span>
          </div>
        ))}
        <div className="mt-0.5 w-fit max-w-[9.5rem] border-t border-amber-900/25 pt-1">
          <div className="flex items-start gap-1.5">
            <span
              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#fbbf24] bg-[#ca8a04]"
              aria-hidden
            />
            <span className="text-[8px] font-medium leading-snug text-amber-100/48">
              Gold dot under each merchant demand icon: beer for that strip (hollow when used). Refill at rail era.
            </span>
          </div>
        </div>
        <p className="w-fit max-w-[9.5rem] border-t border-amber-900/25 pt-1 text-[8px] leading-snug text-amber-100/38">
          Triple C/M/P disc: one demand strip, one beer below it. Map tooltips on hover.
        </p>
      </m.div>

      {/* Build costs by tier — hover to enlarge (bottom-left anchor) */}
      <m.div
        className="absolute bottom-2 left-2 z-20 flex max-h-[min(45vh,280px)] w-max max-w-[11rem] cursor-pointer flex-col gap-0.5 overflow-y-auto rounded-lg border border-amber-900/30 bg-[#14100e]/92 px-2 py-1.5 shadow-lg shadow-black/40 backdrop-blur-sm ring-1 ring-white/5"
        style={{ transformOrigin: 'bottom left' }}
        title="Build costs per level: £ and resources (hover to enlarge)"
        whileHover={reduceMotion ? undefined : { scale: 1.2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200/45">
          Build costs
        </span>
        <span className="text-[8px] leading-tight text-amber-100/40">
          £ + K coal, I iron, B beer
        </span>
        {INDUSTRY_LEGEND_ORDER.map((industryId, idx) => {
          const def = industryDefinitions[industryId]
          if (!def) return null
          const tiers = dedupeTiersByLevel(def.tilesPerPlayer)
          return (
            <div
              key={industryId}
              className={idx > 0 ? 'mt-1 border-t border-amber-900/25 pt-1' : 'mt-0.5'}
            >
              <div className="mb-0.5 flex w-max items-center gap-1">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black/40 text-[8px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: INDUSTRY_COLORS[industryId] }}
                >
                  {INDUSTRY_LETTERS[industryId]}
                </span>
                <span className="truncate text-[9px] font-semibold text-[#ddd6cc]">
                  {INDUSTRY_LABEL[industryId]}
                </span>
              </div>
              <ul className="space-y-0.5 pl-0.5">
                {tiers.map((row) => (
                  <li
                    key={row.level}
                    className="whitespace-nowrap font-mono text-[8px] leading-snug text-amber-100/65"
                  >
                    L{row.level} £{row.cost}
                    {formatBuildCostResourceSuffix(row)}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </m.div>

      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-900/35 bg-gradient-to-b from-[#2a2218] to-[#14100e] text-lg leading-none text-amber-100/90 shadow-lg shadow-black/40 transition hover:from-[#352a1e] hover:to-[#1a1510] hover:text-amber-50"
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-900/35 bg-gradient-to-b from-[#2a2218] to-[#14100e] text-lg leading-none text-amber-100/90 shadow-lg shadow-black/40 transition hover:from-[#352a1e] hover:to-[#1a1510]"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-900/35 bg-gradient-to-b from-[#2a2218] to-[#14100e] text-xs font-bold leading-none text-amber-100/90 shadow-lg shadow-black/40 transition hover:from-[#352a1e] hover:to-[#1a1510]"
          title="Reset view"
        >
          R
        </button>
      </div>
    </div>
  )
}

function locationIdsWithEmptySlotForIndustry (gameState, industry) {
  const valid = new Set()
  if (!industry || !gameState?.board?.locations) return valid
  for (const [locId, boardLoc] of Object.entries(gameState.board.locations)) {
    const hasSlot = boardLoc.slots?.some(
      s => s.tileId === null && (s.allowedIndustries || []).includes(industry)
    )
    if (hasSlot) valid.add(locId)
  }
  return valid
}

function buildValidLocationSet (selectedAction, cardObj, gameState, buildIndustry) {
  if (selectedAction !== 'build') return null

  if (!cardObj) {
    if (buildIndustry) return locationIdsWithEmptySlotForIndustry(gameState, buildIndustry)
    return null
  }

  if (cardObj.type === 'wildLocation' || cardObj.type === 'wildIndustry') {
    if (buildIndustry) return locationIdsWithEmptySlotForIndustry(gameState, buildIndustry)
    return null
  }

  if (cardObj.type === 'location') {
    return new Set([cardObj.locationId])
  }

  if (cardObj.type === 'industry') {
    return locationIdsWithEmptySlotForIndustry(gameState, cardObj.industry)
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
