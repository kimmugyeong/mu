const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database helper
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      if (fs.existsSync(SEED_FILE)) {
        const seedData = fs.readFileSync(SEED_FILE, 'utf-8');
        fs.writeFileSync(DB_FILE, seedData, 'utf-8');
        return JSON.parse(seedData);
      }
      const initial = { menus: [], chats: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading DB, recovering:', err);
    return { menus: [], chats: [] };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Broadcast to all connected clients
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Track online users
let onlineUsers = 0;

wss.on('connection', (ws) => {
  onlineUsers++;
  broadcast('USER_COUNT', { count: onlineUsers });

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      if (data.type === 'CHAT_MESSAGE') {
        const { nickname, message, avatarColor } = data.payload;
        if (!message || !message.trim()) return;

        const db = loadDB();
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newChat = {
          id: 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          nickname: (nickname || '익명의 미식가').slice(0, 15),
          message: message.trim().slice(0, 200),
          time: timeStr,
          avatarColor: avatarColor || '#FF6B4A',
          createdAt: now.toISOString()
        };

        db.chats = db.chats || [];
        db.chats.push(newChat);
        // Keep last 150 chats
        if (db.chats.length > 150) {
          db.chats = db.chats.slice(db.chats.length - 150);
        }
        saveDB(db);

        broadcast('NEW_CHAT', newChat);
      }
    } catch (err) {
      console.error('WS Message parsing error:', err);
    }
  });

  ws.on('close', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    broadcast('USER_COUNT', { count: onlineUsers });
  });
});

// REST APIs
// 1. Get all menus with optional search & filter
app.get('/api/menus', (req, res) => {
  const { category, search, sort } = req.query;
  const db = loadDB();
  let menus = db.menus || [];

  if (category && category !== '전체') {
    menus = menus.filter(m => m.category === category);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    menus = menus.filter(m => 
      m.name.toLowerCase().includes(q) ||
      (m.restaurant && m.restaurant.toLowerCase().includes(q)) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(q))) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  }

  if (sort === 'likes') {
    menus.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (sort === 'priceAsc') {
    menus.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === 'priceDesc') {
    menus.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else {
    // Default: latest or by id reverse
    menus.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  res.json({ success: true, count: menus.length, menus });
});

// 2. Add new menu
app.post('/api/menus', (req, res) => {
  const { name, category, price, restaurant, description, tags, author } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '메뉴 이름을 입력해주세요.' });
  }

  const validCategories = ['한식', '중식', '양식', '분식', '면종류', '일식/아시안', '기타'];
  const menuCategory = validCategories.includes(category) ? category : '한식';

  const db = loadDB();
  const newMenu = {
    id: 'menu-' + Date.now(),
    name: name.trim().slice(0, 30),
    category: menuCategory,
    price: Number(price) > 0 ? Number(price) : 9000,
    restaurant: restaurant ? restaurant.trim().slice(0, 30) : '',
    description: description ? description.trim().slice(0, 100) : '',
    tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean).slice(0, 5) : [],
    likes: 0,
    author: author ? author.trim().slice(0, 15) : '익명',
    createdAt: new Date().toISOString()
  };

  db.menus = db.menus || [];
  db.menus.unshift(newMenu);
  saveDB(db);

  // Broadcast to all clients
  broadcast('MENU_ADDED', newMenu);

  res.status(201).json({ success: true, menu: newMenu });
});

// 3. Like a menu
app.post('/api/menus/:id/like', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const menu = (db.menus || []).find(m => m.id === id);

  if (!menu) {
    return res.status(404).json({ success: false, message: '해당 메뉴를 찾을 수 없습니다.' });
  }

  menu.likes = (menu.likes || 0) + 1;
  saveDB(db);

  broadcast('MENU_LIKED', { id: menu.id, likes: menu.likes });

  res.json({ success: true, id: menu.id, likes: menu.likes });
});

// 4. Delete a menu
app.delete('/api/menus/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const initialLength = (db.menus || []).length;
  db.menus = (db.menus || []).filter(m => m.id !== id);

  if (db.menus.length === initialLength) {
    return res.status(404).json({ success: false, message: '삭제할 메뉴가 없습니다.' });
  }

  saveDB(db);
  broadcast('MENU_DELETED', { id });

  res.json({ success: true, message: '메뉴가 삭제되었습니다.' });
});

// 5. Get chats
app.get('/api/chats', (req, res) => {
  const db = loadDB();
  const chats = (db.chats || []).slice(-100);
  res.json({ success: true, chats, onlineCount: onlineUsers });
});

// 6. Get category statistics
app.get('/api/stats', (req, res) => {
  const db = loadDB();
  const menus = db.menus || [];
  const categories = ['한식', '중식', '양식', '분식', '면종류', '일식/아시안', '기타'];
  const counts = {};
  categories.forEach(c => { counts[c] = 0; });
  menus.forEach(m => {
    if (counts[m.category] !== undefined) {
      counts[m.category]++;
    } else {
      counts['기타'] = (counts['기타'] || 0) + 1;
    }
  });
  res.json({ success: true, totalMenus: menus.length, counts });
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

// Fallback to index.html for SPA (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  const localIp = getLocalIP();
  console.log('='.repeat(55));
  console.log(`🍱 [Lunch Lab - 오늘의 점심] 서버 실행 완료!`);
  console.log(`📱 로컬 접속:   http://localhost:${PORT}`);
  console.log(`📱 모바일 접속: http://${localIp}:${PORT}`);
  console.log('='.repeat(55));
});
