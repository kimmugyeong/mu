require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory event broadcaster callback (used by server.js for WebSockets)
let broadcastCallback = null;
function setBroadcastCallback(cb) {
  broadcastCallback = cb;
}
function notifyBroadcast(type, payload) {
  if (broadcastCallback) {
    try {
      broadcastCallback(type, payload);
    } catch (e) {
      console.error('Broadcast error:', e);
    }
  }
}

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

    notifyBroadcast('MENU_ADDED', newMenu);

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

    notifyBroadcast('MENU_LIKED', { id: result.id, likes: result.likes });
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

    notifyBroadcast('MENU_DELETED', { id });
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

// 6. Post new chat via HTTP REST API (Essential for Vercel Serverless environment where WebSockets are not persistent)
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

    notifyBroadcast('NEW_CHAT', newChat);

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

// 8. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA Fallback
app.use((req, res, next) => {
  // If it's an API route that wasn't matched, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = {
  app,
  setBroadcastCallback
};
