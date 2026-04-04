'use client'

import { io } from 'socket.io-client'

let socket = null

export function getSocket () {
  if (!socket) {
    socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
  }
  return socket
}
