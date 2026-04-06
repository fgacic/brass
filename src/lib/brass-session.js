const STORAGE_KEY = 'brass_session'

export function saveBrassSession ({ roomCode, playerId }) {
  if (typeof window === 'undefined' || !roomCode || !playerId) return
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ roomCode: String(roomCode).toUpperCase(), playerId })
    )
  } catch {
    // ignore quota / private mode
  }
}

export function readBrassSession () {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.roomCode || !data?.playerId) return null
    return {
      roomCode: String(data.roomCode).toUpperCase(),
      playerId: data.playerId,
    }
  } catch {
    return null
  }
}

export function clearBrassSession () {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
