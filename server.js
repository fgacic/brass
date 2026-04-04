const { createServer } = require('http')
const next = require('next')
const { Server } = require('socket.io')
const { registerSocketHandlers } = require('./src/server/socket-handlers')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res))

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  registerSocketHandlers(io)

  httpServer.listen(port, () => {
    console.log(`> Brass: Birmingham running on http://${hostname}:${port}`)
  })
})
