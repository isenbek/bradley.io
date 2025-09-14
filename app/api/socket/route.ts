import { NextRequest, NextResponse } from 'next/server'

// Note: Socket.IO integration in App Router requires a different approach
// This endpoint returns information about the WebSocket server


export async function GET(request: NextRequest) {
  // This endpoint returns information about the WebSocket server
  // The actual WebSocket server is running separately via wargames-server.js
  return NextResponse.json({
    status: 'WebSocket server running on port 3333',
    endpoint: 'ws://localhost:3333',
    note: 'WOPR terminal uses separate WebSocket server for real-time communication'
  })
}