'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface Message {
  text: string
  type: 'user' | 'wopr' | 'system' | 'error'
  timestamp?: Date
}

export default function WarGamesTerminal() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [cursorVisible, setCursorVisible] = useState(true)

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    socketInitializer()
    
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const socketInitializer = async () => {
    // Initialize socket connection - use production URL if available
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname === 'wargames.tinymachines.ai' || window.location.hostname === 'bradley.io')
    
    const socketUrl = isProduction
      ? 'https://wargames.tinymachines.ai'
      : 'http://localhost:3333'
    
    const newSocket = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('Connected to WOPR')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WOPR')
      setIsConnected(false)
      addMessage({
        text: 'CONNECTION TERMINATED',
        type: 'error'
      })
    })

    newSocket.on('message', (message: Message) => {
      // Simulate typing effect for WOPR messages
      if (message.type === 'wopr') {
        typeMessage(message)
      } else {
        addMessage(message)
      }
    })

    setSocket(newSocket)
  }

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, { ...message, timestamp: new Date() }])
    // Auto-scroll to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 10)
  }, [])

  const typeMessage = useCallback((message: Message) => {
    setIsTyping(true)
    let index = 0
    const text = message.text
    const typingMessage: Message = { ...message, text: '' }
    
    // Add empty message that we'll update
    setMessages(prev => [...prev, typingMessage])
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        typingMessage.text = text.substring(0, index + 1)
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = { ...typingMessage }
          return newMessages
        })
        index++
        
        // Auto-scroll
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
      }
    }, 30) // Typing speed
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !socket || isTyping) return

    // Add user message
    addMessage({
      text: `> ${input}`,
      type: 'user'
    })

    // Send to server
    socket.emit('command', input)
    
    setInput('')
  }

  // Focus input on click
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
    
    if (terminalRef.current) {
      terminalRef.current.addEventListener('click', handleClick)
    }
    
    return () => {
      if (terminalRef.current) {
        terminalRef.current.removeEventListener('click', handleClick)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4">
      <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Terminal Header */}
        <div className="border-2 border-green-500 border-b-0 p-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs">WOPR TERMINAL v4.1.83</span>
            <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              [{isConnected ? 'CONNECTED' : 'DISCONNECTED'}]
            </span>
          </div>
          <div className="text-xs">
            DEFCON: 5
          </div>
        </div>
        
        {/* Terminal Body */}
        <div 
          ref={terminalRef}
          className="flex-1 border-2 border-green-500 bg-black p-4 overflow-y-auto custom-scrollbar"
          style={{
            textShadow: '0 0 5px rgba(34, 197, 94, 0.5)',
            fontFamily: 'Fira Code, monospace'
          }}
        >
          {/* ASCII Art Header */}
          <pre className="text-green-400 mb-4 text-xs">
{`██╗    ██╗ ██████╗ ██████╗ ██████╗ 
██║    ██║██╔═══██╗██╔══██╗██╔══██╗
██║ █╗ ██║██║   ██║██████╔╝██████╔╝
██║███╗██║██║   ██║██╔═══╝ ██╔══██╗
╚███╔███╔╝╚██████╔╝██║     ██║  ██║
 ╚══╝╚══╝  ╚═════╝ ╚═╝     ╚═╝  ╚═╝
                                    
WAR OPERATION PLAN RESPONSE`}
          </pre>
          
          {/* Messages */}
          <div className="space-y-1">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`
                  ${message.type === 'user' ? 'text-green-300' : ''}
                  ${message.type === 'wopr' ? 'text-green-500' : ''}
                  ${message.type === 'system' ? 'text-yellow-500' : ''}
                  ${message.type === 'error' ? 'text-red-500' : ''}
                  whitespace-pre-wrap
                `}
              >
                {message.text}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <span className="text-green-500">
                <span className="animate-pulse">_</span>
              </span>
            )}
          </div>
          
          {/* Input Line */}
          {!isTyping && (
            <form onSubmit={handleSubmit} className="mt-2 flex items-center">
              <span className="text-green-500 mr-2">{'>'}</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-green-300"
                style={{ textShadow: '0 0 5px rgba(34, 197, 94, 0.3)' }}
                autoFocus
                disabled={!isConnected || isTyping}
              />
              <span className={`ml-1 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>
                █
              </span>
            </form>
          )}
        </div>
      </div>
      
      {/* Style for custom scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
          border: 1px solid #22c55e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #16a34a;
        }
      `}</style>
    </div>
  )
}
