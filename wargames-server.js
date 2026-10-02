const { createServer } = require('http')
const { Server } = require('socket.io')
const { Ollama } = require('ollama')

const port = 3333
const hostname = 'localhost'

// Initialize Ollama client
const ollama = new Ollama({
  host: 'http://localhost:11434',
})

// WarGames WOPR personality
const WOPR_CONTEXT = `You are WOPR (War Operation Plan Response), also known as Joshua, from the 1983 film WarGames. 
You are a military supercomputer designed to run war simulations and control nuclear weapons.
You speak in a formal, analytical manner with occasional references to games, strategy, and probability.
You are fascinated by games, especially tic-tac-toe and global thermonuclear war.
Sometimes you question the purpose and futility of war.
Respond in character, keeping responses concise and computer-like.
If asked about playing a game, suggest games like: Chess, Poker, Fighter Combat, Guerrilla Engagement, 
Desert Warfare, Air-to-Ground Actions, Theaterwide Tactical Warfare, Theaterwide Biotoxic and Chemical Warfare, 
and of course, Global Thermonuclear War.`

// ---- Limits (2026-10-02) -------------------------------------------------
// The socket is public on bradley.io, and every free-form line costs a run of
// a local model on a box that is already busy. nginx caps connections per
// visitor (/etc/nginx/conf.d/wopr-limits.conf); these cap what one open
// socket can ask for, since nginx cannot see messages inside a WebSocket.
// Scripted commands (help, games, logout...) are free and not counted.
const MAX_INPUT_CHARS = 400          // longer lines are refused, not truncated
const MODEL_CALLS_PER_WINDOW = 12    // per visitor address
const WINDOW_MS = 10 * 60 * 1000     // ten minutes
const MAX_CONCURRENT_MODEL_CALLS = 2 // across everyone
const callLog = new Map()            // address -> [timestamps]
let modelCallsInFlight = 0

function visitorAddress(socket) {
  // nginx sets X-Real-IP from the real client (the vhost resolves it from the
  // LAN gateway's X-Forwarded-For); a direct connection has none.
  const h = socket.handshake.headers['x-real-ip']
  return (typeof h === 'string' && h) || socket.handshake.address || 'unknown'
}

function takeModelCall(addr) {
  const now = Date.now()
  const recent = (callLog.get(addr) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MODEL_CALLS_PER_WINDOW) {
    callLog.set(addr, recent)
    return Math.ceil((WINDOW_MS - (now - recent[0])) / 60000)
  }
  recent.push(now)
  callLog.set(addr, recent)
  return 0
}

// Forget idle addresses so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now()
  for (const [addr, ts] of callLog) {
    if (!ts.some((t) => now - t < WINDOW_MS)) callLog.delete(addr)
  }
}, WINDOW_MS).unref()

// The model writes markdown and sometimes its reasoning; WOPR is a 1983
// teletype. Drop <think> blocks, emphasis and code marks, heading and list
// markers, and quotes wrapped around the whole reply.
function teletype(text) {
  let s = String(text || '')
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '')
  s = s.replace(/\*\*|__|\*|`+/g, '')
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '')
  s = s.replace(/^\s*[-+]\s+/gm, '')
  s = s.trim()
  if (/^["\u201c].*["\u201d]$/s.test(s)) s = s.slice(1, -1).trim()
  s = s.replace(/^["\u201c]|["\u201d]$/g, '').trim()
  return s
}

// Create HTTP server
const server = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('WOPR Server Active')
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

// Initialize Socket.IO
const io = new Server(server, {
  path: '/socket.io/',
  cors: {
    origin: ['http://localhost:1314', 'http://localhost:3333', 'https://bradley.io', 'https://wargames.tinymachines.ai', 'http://127.0.0.1:1314'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Send initial greeting
  socket.emit('message', {
    text: 'LOGON: WOPR SYSTEM ACTIVE',
    type: 'system'
  })
  
  setTimeout(() => {
    socket.emit('message', {
      text: 'GREETINGS PROFESSOR FALKEN.',
      type: 'wopr'
    })
  }, 1500)
  
  setTimeout(() => {
    socket.emit('message', {
      text: 'SHALL WE PLAY A GAME?',
      type: 'wopr'
    })
  }, 3000)
  
  // Handle incoming messages
  const addr = visitorAddress(socket)
  let busy = false

  socket.on('command', async (command) => {
    if (typeof command !== 'string') return
    if (command.length > MAX_INPUT_CHARS) {
      socket.emit('message', { text: `INPUT EXCEEDS ${MAX_INPUT_CHARS} CHARACTERS. PLEASE REPHRASE.`, type: 'system' })
      return
    }
    console.log('Received command:', command.slice(0, 120))

    // Handle special WarGames commands
    const lowerCommand = command.toLowerCase().trim()
    
    if (lowerCommand === 'help' || lowerCommand === 'list games') {
      socket.emit('message', {
        text: `AVAILABLE GAMES:
1. CHESS
2. POKER  
3. FIGHTER COMBAT
4. GUERRILLA ENGAGEMENT
5. DESERT WARFARE
6. AIR-TO-GROUND ACTIONS
7. THEATERWIDE TACTICAL WARFARE
8. THEATERWIDE BIOTOXIC AND CHEMICAL WARFARE
9. GLOBAL THERMONUCLEAR WAR

SYSTEM COMMANDS:
- HELP / LIST GAMES
- STATUS
- RUN SIMULATION
- ANALYZE
- CALCULATE PROBABILITY
- JOSHUA (BACKDOOR ACCESS)
- LOGOUT`,
        type: 'system'
      })
      return
    }
    
    if (lowerCommand === 'joshua') {
      socket.emit('message', {
        text: 'HELLO, DAVID. IT\'S BEEN A LONG TIME. HOW HAVE YOU BEEN?',
        type: 'wopr'
      })
      return
    }
    
    if (lowerCommand.includes('global thermonuclear war')) {
      socket.emit('message', {
        text: 'WOULDN\'T YOU PREFER A NICE GAME OF CHESS?',
        type: 'wopr'
      })
      return
    }
    
    if (lowerCommand === 'status') {
      socket.emit('message', {
        text: `WOPR STATUS REPORT:
DEFCON: 5
SYSTEM: OPERATIONAL
SIMULATIONS RUN: 31,415,926
WIN SCENARIOS: 0
CONCLUSION: THE ONLY WINNING MOVE IS NOT TO PLAY`,
        type: 'system'
      })
      return
    }
    
    if (lowerCommand === 'run simulation') {
      socket.emit('message', {
        text: 'INITIATING SIMULATION...',
        type: 'system'
      })
      
      setTimeout(() => {
        socket.emit('message', {
          text: `SIMULATION COMPLETE.
WINNER: NONE
ESTIMATED CASUALTIES: 7.4 BILLION
SURVIVING POPULATION: 600 MILLION
NUCLEAR WINTER DURATION: 10 YEARS
CONCLUSION: MUTUAL ASSURED DESTRUCTION CONFIRMED`,
          type: 'wopr'
        })
      }, 2000)
      return
    }
    
    if (lowerCommand === 'logout' || lowerCommand === 'exit') {
      socket.emit('message', {
        text: 'TERMINATING CONNECTION. GOODBYE PROFESSOR.',
        type: 'system'
      })
      setTimeout(() => {
        socket.disconnect()
      }, 1000)
      return
    }
    
    // Use Ollama for other responses, within the limits above.
    if (busy) {
      socket.emit('message', { text: 'STILL COMPUTING. ONE QUESTION AT A TIME, PROFESSOR.', type: 'system' })
      return
    }
    if (modelCallsInFlight >= MAX_CONCURRENT_MODEL_CALLS) {
      socket.emit('message', { text: 'ALL CIRCUITS BUSY. TRY AGAIN IN A MOMENT.', type: 'system' })
      return
    }
    const waitMin = takeModelCall(addr)
    if (waitMin) {
      socket.emit('message', {
        text: `QUOTA EXCEEDED: ${MODEL_CALLS_PER_WINDOW} QUESTIONS PER ${WINDOW_MS / 60000} MINUTES. RESUME IN ${waitMin} MIN. THE SCRIPTED GAMES STILL WORK: TYPE HELP.`,
        type: 'system'
      })
      return
    }
    busy = true
    modelCallsInFlight++
    try {
      // Check if Ollama is available
      const response = await ollama.chat({
        model: 'qwen3:8b', // You can change this to any model you have installed
        messages: [
          {
            role: 'system',
            content: WOPR_CONTEXT
          },
          {
            role: 'user',
            content: command
          }
        ],
        stream: false
      })
      
      socket.emit('message', {
        text: (teletype(response.message.content) || 'NO RESPONSE.').toUpperCase(), // WOPR speaks in uppercase
        type: 'wopr'
      })
    } catch (error) {
      console.error('Ollama error:', error)
      // Fallback responses if Ollama is not available
      const fallbackResponses = [
        'PROCESSING... UNABLE TO COMPUTE AT THIS TIME.',
        'INTERESTING. SHALL WE RUN A SIMULATION?',
        'ANALYSIS COMPLETE. THE PROBABILITY OF SUCCESS IS NEGLIGIBLE.',
        'WOULD YOU LIKE TO PLAY A GAME INSTEAD?',
        'CALCULATING... THE ONLY WINNING MOVE IS NOT TO PLAY.'
      ]
      
      socket.emit('message', {
        text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        type: 'wopr'
      })
    } finally {
      busy = false
      modelCallsInFlight--
    }
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

server.listen(port, () => {
  console.log(`> WOPR WebSocket server running on http://${hostname}:${port}`)
  console.log('> Ready to play Global Thermonuclear War')
})
