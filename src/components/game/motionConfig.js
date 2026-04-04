'use client'

import { LazyMotion, domMax } from 'motion/react'

export { m, motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react'

export function GameMotionRoot ({ children }) {
  return (
    <LazyMotion features={domMax}>
      {children}
    </LazyMotion>
  )
}
