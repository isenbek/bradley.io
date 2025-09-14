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
  socket.on('command', async (command) => {
    console.log('Received command:', command)
    
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
    
    // Use Ollama for other responses
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
        text: response.message.content.toUpperCase(), // WOPR speaks in uppercase
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
