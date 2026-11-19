require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { WebSocketServer, WebSocket } = require('ws');
const db = require('./db');

const app = express();

const PORT = process.env.PORT || 3000;

// Ensure PostgreSQL is initialized on cold start (especially for Vercel)
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await db.initDB();
      dbInitialized = true;
    } catch (err) {
      console.error('Database init on request error:', err);
    }
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory event broadcaster callback for WebSockets (Active in local mode)
let broadcastCallback = null;
function broadcast(type, payload) {
  if (broadcastCallback) {
    broadcastCallback(type, payload);
  }
}

// ============================================================================
// REST APIs (PostgreSQL backed)
// ============================================================================

// 1. Get all menus with optional search & filter
app.get('/api/menus', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const menus = await db.getMenus({ category, search, sort });
    res.json({ success: true, count: menus.length, menus });
  } catch (err) {
    console.error('API getMenus error:', err);
    res.status(500).json({ success: false, message: '메뉴 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 2. Add new menu
app.post('/api/menus', async (req, res) => {
  try {
    const { name, category, price, restaurant, description, tags, author } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '메뉴 이름을 입력해주세요.' });
    }

    const newMenu = await db.addMenu({
      name,
      category,
      price,
      restaurant,
      description,
      tags,
      author
    });

    broadcast('MENU_ADDED', newMenu);

    res.status(201).json({ success: true, menu: newMenu });
  } catch (err) {
    console.error('API addMenu error:', err);
    res.status(500).json({ success: false, message: '메뉴 등록에 실패했습니다.' });
  }
});

// 3. Like a menu
app.post('/api/menus/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.likeMenu(id);

    if (!result) {
      return res.status(404).json({ success: false, message: '해당 메뉴를 찾을 수 없습니다.' });
    }

    broadcast('MENU_LIKED', { id: result.id, likes: result.likes });
    res.json({ success: true, id: result.id, likes: result.likes });
  } catch (err) {
    console.error('API likeMenu error:', err);
    res.status(500).json({ success: false, message: '좋아요 처리에 실패했습니다.' });
  }
});

// 4. Delete a menu
app.delete('/api/menus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteMenu(id);

    if (!success) {
      return res.status(404).json({ success: false, message: '삭제할 메뉴가 없습니다.' });
    }

    broadcast('MENU_DELETED', { id });
    res.json({ success: true, message: '메뉴가 삭제되었습니다.' });
  } catch (err) {
    console.error('API deleteMenu error:', err);
    res.status(500).json({ success: false, message: '메뉴 삭제에 실패했습니다.' });
  }
});

// 5. Get chats
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await db.getChats(100);
    res.json({ success: true, chats, onlineCount: 1 });
  } catch (err) {
    console.error('API getChats error:', err);
    res.status(500).json({ success: false, message: '채팅 내역을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 6. Post new chat via HTTP (for Vercel & serverless)
app.post('/api/chats', async (req, res) => {
  try {
    const { nickname, message, avatarColor } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: '메시지를 입력해주세요.' });
    }

    const newChat = await db.addChat({
      nickname,
      message,
      avatarColor
    });

    broadcast('NEW_CHAT', newChat);

    res.status(201).json({ success: true, chat: newChat });
  } catch (err) {
    console.error('API addChat error:', err);
    res.status(500).json({ success: false, message: '메시지 전송에 실패했습니다.' });
  }
});

// 7. Get category statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error('API getStats error:', err);
    res.status(500).json({ success: false, message: '통계를 불러오지 못했습니다.' });
  }
});

// 8. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA Fallback (Serve index.html for non-API routes)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================================
// Local Server & WebSocket initialization (Runs when NOT in Vercel serverless)
// ============================================================================

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

if (!process.env.VERCEL) {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  let onlineUsers = 0;

  broadcastCallback = (type, payload) => {
    const message = JSON.stringify({ type, payload, timestamp: Date.now() });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  wss.on('connection', (ws) => {
    onlineUsers++;
    broadcast('USER_COUNT', { count: onlineUsers });

    ws.on('message', async (messageRaw) => {
      try {
        const data = JSON.parse(messageRaw.toString());
        if (data.type === 'CHAT_MESSAGE') {
          const { nickname, message, avatarColor } = data.payload;
          if (!message || !message.trim()) return;

          const newChat = await db.addChat({
            nickname,
            message,
            avatarColor
          });

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

  server.listen(PORT, async () => {
    try {
      await db.initDB();
      dbInitialized = true;
    } catch (e) {
      console.error('DB startup init failed:', e);
    }
    const localIp = getLocalIP();
    console.log('='.repeat(60));
    console.log(`🍱 [Lunch Lab - 오늘의 점심] 서버 실행 완료! (PostgreSQL 연동)`);
    console.log(`💾 데이터베이스: Neon PostgreSQL (tennis-joa 설정 공유)`);
    console.log(`📱 로컬 접속:    http://localhost:${PORT}`);
    console.log(`📱 모바일 접속:  http://${localIp}:${PORT}`);
    console.log('='.repeat(60));
  });
}

// Export for Vercel Serverless Function
module.exports = app;
