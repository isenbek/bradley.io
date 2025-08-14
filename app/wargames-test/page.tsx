'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export default function WarGamesTest() {
  const [status, setStatus] = useState('Initializing...')
  const [logs, setLogs] = useState<string[]>([])
  
  useEffect(() => {
    const addLog = (message: string) => {
      const timestamp = new Date().toISOString()
      setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    }
    
    addLog('Starting WebSocket test...')
    
    const socketUrl = 'https://wargames.tinymachines.ai'
    addLog(`Connecting to: ${socketUrl}`)
    
    const socket = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    
    socket.on('connect', () => {
      addLog('✅ Connected successfully!')
      setStatus('Connected')
    })
    
    socket.on('connect_error', (error) => {
      addLog(`❌ Connection error: ${error.message}`)
      setStatus('Error')
    })
    
    socket.on('disconnect', (reason) => {
      addLog(`⚠️ Disconnected: ${reason}`)
      setStatus('Disconnected')
    })
    
    socket.on('message', (data: any) => {
      addLog(`📨 Received message: ${JSON.stringify(data)}`)
    })
    
    return () => {
      addLog('Cleaning up connection...')
      socket.disconnect()
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-8">
      <h1 className="text-2xl mb-4">WebSocket Connection Test</h1>
      
      <div className="mb-4">
        <span>Status: </span>
        <span className={
          status === 'Connected' ? 'text-green-400' :
          status === 'Error' ? 'text-red-400' :
          status === 'Disconnected' ? 'text-yellow-400' :
          'text-gray-400'
        }>
          {status}
        </span>
      </div>
      
      <div className="border border-green-500 p-4 rounded">
        <h2 className="text-lg mb-2">Connection Logs:</h2>
        <div className="space-y-1 text-xs">
          {logs.map((log, i) => (
            <div key={i} className="font-mono">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}