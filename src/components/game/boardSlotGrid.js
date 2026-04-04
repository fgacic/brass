/** SVG layout for city/town industry slots: fixed square grid under location anchor. */

export const SLOT_CELL = 18
export const SLOT_GAP = 3

/**
 * @param {number} slotCount
 * @returns {{ cols: number, rows: number, positions: { row: number, col: number, offsetX?: number }[] }}
 */
export function computeSlotGridLayout (slotCount) {
  if (slotCount <= 0) return { cols: 0, rows: 0, positions: [] }
  if (slotCount === 1) {
    return { cols: 1, rows: 1, positions: [{ row: 0, col: 0 }] }
  }
  if (slotCount === 2) {
    return { cols: 2, rows: 1, positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }
  }
  if (slotCount === 3) {
    const ox = (SLOT_CELL + SLOT_GAP) / 2
    return {
      cols: 2,
      rows: 2,
      positions: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0, offsetX: ox },
      ],
    }
  }
  if (slotCount === 4) {
    return {
      cols: 2,
      rows: 2,
      positions: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
    }
  }
  const cols = 2
  const rows = Math.ceil(slotCount / cols)
  const positions = []
  for (let i = 0; i < slotCount; i++) {
    positions.push({ row: Math.floor(i / cols), col: i % cols })
  }
  return { cols, rows, positions }
}

/**
 * @param {{ x: number, y: number }} pos — map anchor (connection endpoints).
 * @param {number} slotCount
 * @param {{ cellSize?: number, gap?: number, centerYOffset?: number }} [options]
 */
export function computeSlotGridGeometry (pos, slotCount, options = {}) {
  const CELL = options.cellSize ?? SLOT_CELL
  const GAP = options.gap ?? SLOT_GAP
  const centerYOffset = options.centerYOffset ?? -4

  const layout = computeSlotGridLayout(slotCount)
  if (layout.cols === 0) return null

  const gridW = layout.cols * CELL + (layout.cols - 1) * GAP
  const gridH = layout.rows * CELL + (layout.rows - 1) * GAP
  const centerX = pos.x
  const centerY = pos.y + centerYOffset
  const startX = centerX - gridW / 2
  const startY = centerY - gridH / 2

  const cells = layout.positions.map((p, slotIndex) => {
    const offsetX = p.offsetX ?? 0
    const cx = startX + p.col * (CELL + GAP) + CELL / 2 + offsetX
    const cy = startY + p.row * (CELL + GAP) + CELL / 2
    return {
      slotIndex,
      cx,
      cy,
      x: cx - CELL / 2,
      y: cy - CELL / 2,
      size: CELL,
    }
  })

  return {
    cellSize: CELL,
    gap: GAP,
    gridLeft: startX,
    gridTop: startY,
    gridWidth: gridW,
    gridHeight: gridH,
    centerX,
    centerY,
    cells,
  }
}
