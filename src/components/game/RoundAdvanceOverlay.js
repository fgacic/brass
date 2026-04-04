'use client'

import { useEffect, useRef } from 'react'
import { Howl, Howler } from 'howler'
import { m, AnimatePresence, useReducedMotion } from './motionConfig'

function playWindUp (howlRef) {
  const howl = howlRef.current
  if (!howl) return

  const run = () => {
    try {
      howl.stop()
      howl.play()
    } catch (err) {
      console.warn('RoundAdvanceOverlay sound failed', err)
    }
  }

  const ctx = Howler.ctx
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(run).catch(() => {
      const unlock = () => {
        Howler.ctx?.resume().then(() => {
          run()
        }).catch(() => {})
        window.removeEventListener('pointerdown', unlock)
      }
      window.addEventListener('pointerdown', unlock, { once: true })
    })
  } else {
    run()
  }
}

export function RoundAdvanceOverlay ({ round }) {
  const reduceMotion = useReducedMotion()
  const howlRef = useRef(null)
  const prevRoundRef = useRef(null)

  useEffect(() => {
    const howl = new Howl({
      src: ['/sounds/round-windup.wav'],
      volume: 0.42,
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
    const prev = prevRoundRef.current
    prevRoundRef.current = round
    if (round == null || prev != null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    playWindUp(howlRef)
  }, [round])

  return (
    <AnimatePresence>
      {round != null && (
        <m.div
          key="round-advance-overlay"
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
        >
          <m.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <m.div
            className="relative max-w-[min(90vw,24rem)] rounded-2xl border-2 border-amber-400/45 bg-gradient-to-b from-amber-950/95 via-[#1c1410]/98 to-stone-950/98 px-12 py-9 text-center shadow-[0_0_60px_rgba(251,191,36,0.25)] ring-4 ring-amber-500/25"
            initial={reduceMotion ? false : { scale: 0.55, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { scale: 0.88, opacity: 0, rotate: 3 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                  type: 'spring',
                  stiffness: 280,
                  damping: 22,
                  mass: 1
                }
            }
          >
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/75">
              New turn
            </p>
            <p className="mt-3 font-display text-5xl font-bold tabular-nums text-amber-50 drop-shadow-[0_2px_24px_rgba(251,191,36,0.35)]">
              Turn {round}
            </p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
