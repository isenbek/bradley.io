// udp-websocket-bridge.js
const dgram = require('dgram');
const WebSocket = require('ws');

const ports = {
  gps: { udp: 2222, ws: 8080 },
  adsb: { udp: 2223, ws: 8081 },
  telemetry: { udp: 2224, ws: 8082 }
};

Object.entries(ports).forEach(([name, config]) => {
  // Create UDP server
  const udpServer = dgram.createSocket('udp4');
  
  // Create WebSocket server
  const wss = new WebSocket.Server({ port: config.ws });
  
  udpServer.on('message', (msg) => {
    const data = msg.toString();
    // Broadcast to all connected websocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
  
  udpServer.bind(config.udp);
  console.log(`${name}: UDP:${config.udp} → WebSocket:${config.ws}`);
});
