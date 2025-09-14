// multi-stream-websocket.js
const dgram = require('dgram');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const streams = ['gps', 'adsb', 'telemetry'];
const udpPorts = { gps: 2222, adsb: 2223, telemetry: 2224 };

// Create UDP listeners
Object.entries(udpPorts).forEach(([stream, port]) => {
  const udpServer = dgram.createSocket('udp4');
  
  udpServer.on('message', (msg) => {
    const data = {
      stream: stream,
      timestamp: Date.now(),
      data: JSON.parse(msg.toString())
    };
    
    // Broadcast to all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
  
  udpServer.bind(port);
  console.log(`${stream} UDP listener on port ${port}`);
});

console.log('WebSocket server on port 8080');
