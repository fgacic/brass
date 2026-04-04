const { createServer } = require('http')
const next = require('next')
const { Server } = require('socket.io')
const { registerSocketHandlers } = require('./src/server/socket-handlers')
const { exec } = require('child_process')

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
    console.log(`> Attempting to start ngrok tunnel...`)

    exec(`npx ngrok http ${port} --log=stdout`, (error, stdout) => {
      if (error && error.message.includes('invalid')) {
        console.log(`⚠️  ngrok authtoken invalid or expired`)
        console.log(`📝 Get a new token from: https://dashboard.ngrok.com/get-started/your-authtoken`)
        console.log(`🔑 Then run: npx ngrok authtoken YOUR_NEW_TOKEN`)
        return
      }
    })

    setTimeout(() => {
      exec('curl http://localhost:4040/api/tunnels 2>nul', (error, stdout) => {
        if (!error && stdout) {
          try {
            const data = JSON.parse(stdout)
            if (data.tunnels && data.tunnels.length > 0) {
              const publicUrl = data.tunnels[0].public_url
              console.log(`✅ 🌐 Public URL: ${publicUrl}`)
              console.log(`> Share this URL with others to play together!`)
            }
          } catch (e) {
            // ngrok not responding with valid JSON yet
          }
        }
      })
    }, 3000)
  })
})
