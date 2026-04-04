'use client'

import { useEffect, useRef } from 'react'
import { Howl, Howler } from 'howler'

export function useMyTurnSound (myTurnFlash) {
  const prevFlashRef = useRef(false)
  const howlRef = useRef(null)

  useEffect(() => {
    const howl = new Howl({
      src: ['/sounds/your-turn.wav'],
      volume: 0.35,
      preload: true
    })
    howlRef.current = howl
    return () => {
      howl.unload()
      howlRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const prev = prevFlashRef.current
    prevFlashRef.current = myTurnFlash

    if (!myTurnFlash || prev) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const howl = howlRef.current
    if (!howl) return

    const playOnce = () => {
      try {
        howl.stop()
        howl.play()
      } catch (err) {
        console.warn('useMyTurnSound play failed', err)
      }
    }

    const ctx = Howler.ctx
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(playOnce).catch(() => {
        const unlock = () => {
          Howler.ctx?.resume().then(() => {
            playOnce()
          }).catch(() => {})
          window.removeEventListener('pointerdown', unlock)
        }
        window.addEventListener('pointerdown', unlock, { once: true })
      })
    } else {
      playOnce()
    }
  }, [myTurnFlash])
}
