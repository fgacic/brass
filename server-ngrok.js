const { createServer } = require('http')
const next = require('next')
const { Server } = require('socket.io')
const { registerSocketHandlers } = require('./src/server/socket-handlers')
const { exec, spawn } = require('child_process')

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
    console.log(`> Starting ngrok tunnel (port ${port})…`)

    const ngrokEnv = { ...process.env }
    const ngrok = spawn('npx', ['ngrok', 'http', String(port), '--log=stdout'], {
      env: ngrokEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    ngrok.stderr.on('data', (chunk) => {
      const line = chunk.toString()
      if (line.includes('ERR_') || line.includes('ERROR')) process.stderr.write(chunk)
    })

    ngrok.on('error', (err) => {
      console.error('> ngrok failed to start:', err.message)
    })

    const printPublicUrl = () => {
      exec('curl -sS http://127.0.0.1:4040/api/tunnels 2>/dev/null', (error, stdout) => {
        if (error || !stdout) return
        try {
          const data = JSON.parse(stdout)
          const t = data.tunnels?.find((x) => x.proto === 'https') || data.tunnels?.[0]
          if (t?.public_url) {
            console.log(`✅ 🌐 Public URL: ${t.public_url}`)
            console.log(`> Share this URL with others to play together!`)
          }
        } catch (_) {
          /* ngrok API not ready */
        }
      })
    }

    let tries = 0
    const poll = setInterval(() => {
      tries += 1
      printPublicUrl()
      if (tries >= 12) clearInterval(poll)
    }, 1500)
  })
})
