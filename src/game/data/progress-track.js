// The progress track maps positions to income levels
// Positions 0-99 on the track, grouped into income levels -10 to 30
const progressTrack = [
  { position: 0, income: -10 },
  { position: 1, income: -9 },
  { position: 2, income: -8 },
  { position: 3, income: -7 },
  { position: 4, income: -6 },
  { position: 5, income: -5 },
  { position: 6, income: -4 },
  { position: 7, income: -3 },
  { position: 8, income: -2 },
  { position: 9, income: -1 },
  { position: 10, income: 0 },
  { position: 11, income: 0 },
  { position: 12, income: 1 },
  { position: 13, income: 1 },
  { position: 14, income: 1 },
  { position: 15, income: 2 },
  { position: 16, income: 2 },
  { position: 17, income: 2 },
  { position: 18, income: 3 },
  { position: 19, income: 3 },
  { position: 20, income: 3 },
  { position: 21, income: 4 },
  { position: 22, income: 4 },
  { position: 23, income: 4 },
  { position: 24, income: 5 },
  { position: 25, income: 5 },
  { position: 26, income: 5 },
  { position: 27, income: 6 },
  { position: 28, income: 6 },
  { position: 29, income: 6 },
  { position: 30, income: 7 },
  { position: 31, income: 7 },
  { position: 32, income: 7 },
  { position: 33, income: 8 },
  { position: 34, income: 8 },
  { position: 35, income: 8 },
  { position: 36, income: 9 },
  { position: 37, income: 9 },
  { position: 38, income: 10 },
  { position: 39, income: 10 },
  { position: 40, income: 11 },
  { position: 41, income: 11 },
  { position: 42, income: 12 },
  { position: 43, income: 12 },
  { position: 44, income: 13 },
  { position: 45, income: 13 },
  { position: 46, income: 14 },
  { position: 47, income: 14 },
  { position: 48, income: 15 },
  { position: 49, income: 15 },
  { position: 50, income: 16 },
  { position: 51, income: 16 },
  { position: 52, income: 17 },
  { position: 53, income: 17 },
  { position: 54, income: 18 },
  { position: 55, income: 18 },
  { position: 56, income: 19 },
  { position: 57, income: 19 },
  { position: 58, income: 20 },
  { position: 59, income: 20 },
  { position: 60, income: 21 },
  { position: 61, income: 22 },
  { position: 62, income: 23 },
  { position: 63, income: 24 },
  { position: 64, income: 25 },
  { position: 65, income: 26 },
  { position: 66, income: 27 },
  { position: 67, income: 28 },
  { position: 68, income: 29 },
  { position: 69, income: 30 },
]

function getIncomeAtPosition (position) {
  const clamped = Math.max(0, Math.min(position, progressTrack.length - 1))
  return progressTrack[clamped].income
}

function advanceIncomeMarker (currentPosition, steps) {
  return Math.min(currentPosition + steps, progressTrack.length - 1)
}

function getPositionForIncomeLevel (incomeLevel) {
  for (let i = progressTrack.length - 1; i >= 0; i--) {
    if (progressTrack[i].income === incomeLevel) return i
  }
  return 0
}

function retreatIncomeLevels (currentPosition, levels) {
  const currentIncome = getIncomeAtPosition(currentPosition)
  const targetIncome = currentIncome - levels
  return getPositionForIncomeLevel(Math.max(targetIncome, -10))
}

module.exports = {
  progressTrack,
  getIncomeAtPosition,
  advanceIncomeMarker,
  getPositionForIncomeLevel,
  retreatIncomeLevels,
}
