require('dotenv').config();
const http = require('http');
const os = require('os');
const { WebSocketServer, WebSocket } = require('ws');
const { app, setBroadcastCallback } = require('./api-app');
const db = require('./db');

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Broadcast to all connected clients
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Connect api-app broadcasts to WebSockets
setBroadcastCallback((type, payload) => {
  broadcast(type, payload);
});

// Track online users
let onlineUsers = 0;

wss.on('connection', (ws) => {
  onlineUsers++;
  broadcast('USER_COUNT', { count: onlineUsers });

  ws.on('message', async (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      if (data.type === 'CHAT_MESSAGE') {
        const { nickname, message, avatarColor } = data.payload;
        if (!message || !message.trim()) return;

        // Save chat directly to PostgreSQL
        const newChat = await db.addChat({
          nickname,
          message,
          avatarColor
        });

        // Broadcast to all connected clients
        broadcast('NEW_CHAT', newChat);
      }
    } catch (err) {
      console.error('WS Message error:', err);
    }
  });

  ws.on('close', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    broadcast('USER_COUNT', { count: onlineUsers });
  });
});

// Helper: Get local network IP for mobile device testing
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Initialize PostgreSQL and Start Server
async function startServer() {
  try {
    await db.initDB();

    server.listen(PORT, () => {
      const localIp = getLocalIP();
      console.log('='.repeat(60));
      console.log(`🍱 [Lunch Lab - 오늘의 점심] 서버 실행 완료! (PostgreSQL 연동)`);
      console.log(`💾 데이터베이스: Neon PostgreSQL (tennis-joa 설정 공유)`);
      console.log(`📱 로컬 접속:    http://localhost:${PORT}`);
      console.log(`📱 모바일 접속:  http://${localIp}:${PORT}`);
      console.log('='.repeat(60));
    });
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
}

startServer();
