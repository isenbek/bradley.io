import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { Socket } from 'net'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Ollama } from 'ollama'

// Initialize Ollama client
const ollama = new Ollama({
  host: 'http://localhost:11434', // Default Ollama host
})

// Types for Socket.IO
interface SocketIOResponse extends NextApiResponse {
  socket: Socket & {
    server: HTTPServer & {
      io?: SocketIOServer
    }
  }
}

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

export async function GET(req: NextApiRequest, res: SocketIOResponse) {
  if (!res.socket.server.io) {
    console.log('Starting Socket.IO server...')
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
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
      }, 1000)
      
      setTimeout(() => {
        socket.emit('message', {
          text: 'SHALL WE PLAY A GAME?',
          type: 'wopr'
        })
      }, 2000)
      
      // Handle incoming messages
      socket.on('command', async (command: string) => {
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
- JOSHUA (BACKDOOR ACCESS)`,
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
        
        // Use Ollama for other responses
        try {
          const response = await ollama.chat({
            model: 'llama3.2', // You can change this to any model you have installed
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
            text: response.message.content,
            type: 'wopr'
          })
        } catch (error) {
          console.error('Ollama error:', error)
          socket.emit('message', {
            text: 'SYSTEM ERROR: UNABLE TO PROCESS REQUEST. PLEASE TRY AGAIN.',
            type: 'error'
          })
        }
      })
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
    
    res.socket.server.io = io
  }
  
  res.end()
}