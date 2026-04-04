'use client'

import { useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { useGameStore } from '@/store/gameStore'

export function useGameActions () {
  const sendAction = useCallback((actionType, payload) => {
    const socket = getSocket()
    const { setActionError, resetAction } = useGameStore.getState()

    console.log('[Client] Sending action:', actionType, payload)

    socket.emit('game:action', { actionType, payload }, (response) => {
      console.log('[Client] Action response:', response)
      if (response && response.success) {
        resetAction()
      } else {
        setActionError(response?.error || 'Unknown error')
      }
    })
  }, [])

  const build = useCallback((cardId, locationId, industry) => {
    sendAction('build', { cardId, locationId, industry })
  }, [sendAction])

  const network = useCallback((cardId, connectionIds) => {
    sendAction('network', { cardId, connectionIds })
  }, [sendAction])

  const develop = useCallback((cardId, industries) => {
    sendAction('develop', { cardId, industries })
  }, [sendAction])

  const sell = useCallback((cardId, tileSells) => {
    sendAction('sell', { cardId, tileSells })
  }, [sendAction])

  const loan = useCallback((cardId) => {
    sendAction('loan', { cardId })
  }, [sendAction])

  const scout = useCallback((cardId, discardCardIds) => {
    sendAction('scout', { cardId, discardCardIds })
  }, [sendAction])

  const pass = useCallback((cardId) => {
    sendAction('pass', { cardId })
  }, [sendAction])

  return { build, network, develop, sell, loan, scout, pass, sendAction }
}
