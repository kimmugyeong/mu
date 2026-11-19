require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables & seed data
async function initDB() {
  const client = await pool.connect();
  try {
    console.log('📦 Initializing PostgreSQL tables...');

    // 1. Create lunch_menus table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lunch_menus (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price INTEGER DEFAULT 9000,
        restaurant VARCHAR(100) DEFAULT '',
        description TEXT DEFAULT '',
        tags TEXT[] DEFAULT '{}',
        likes INTEGER DEFAULT 0,
        author VARCHAR(50) DEFAULT '익명',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Create lunch_chats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lunch_chats (
        id VARCHAR(50) PRIMARY KEY,
        nickname VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        time VARCHAR(20) DEFAULT '',
        avatar_color VARCHAR(20) DEFAULT '#FF6B4A',
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Check and seed initial data if empty
    const menuCountRes = await client.query('SELECT COUNT(*) FROM lunch_menus');
    const menuCount = parseInt(menuCountRes.rows[0].count, 10);

    const seedPath = path.join(__dirname, 'data', 'seed.json');
    if (menuCount === 0 && fs.existsSync(seedPath)) {
      console.log('🌱 Seeding initial menus into PostgreSQL...');
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

      for (const m of seedData.menus || []) {
        await client.query(`
          INSERT INTO lunch_menus (id, name, category, price, restaurant, description, tags, likes, author, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING;
        `, [
          m.id,
          m.name,
          m.category,
          m.price || 9000,
          m.restaurant || '',
          m.description || '',
          m.tags || [],
          m.likes || 0,
          m.author || '익명',
          m.createdAt ? new Date(m.createdAt) : new Date()
        ]);
      }

      for (const c of seedData.chats || []) {
        await client.query(`
          INSERT INTO lunch_chats (id, nickname, message, time, avatar_color, is_system, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [
          c.id,
          c.nickname,
          c.message,
          c.time || '',
          c.avatarColor || '#FF6B4A',
          c.isSystem || false,
          new Date()
        ]);
      }
      console.log('✅ Initial seed data populated in PostgreSQL successfully!');
    } else {
      console.log(`✅ PostgreSQL tables ready (Current menus in DB: ${menuCount})`);
    }
  } catch (err) {
    console.error('❌ Error initializing PostgreSQL tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Menu Operations
async function getMenus({ category, search, sort }) {
  let query = 'SELECT * FROM lunch_menus WHERE 1=1';
  const params = [];

  if (category && category !== '전체') {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const idx = params.length;
    query += ` AND (
      LOWER(name) LIKE $${idx} OR 
      LOWER(restaurant) LIKE $${idx} OR 
      LOWER(description) LIKE $${idx} OR 
      array_to_string(tags, ' ') ILIKE $${idx}
    )`;
  }

  if (sort === 'likes') {
    query += ' ORDER BY likes DESC, created_at DESC';
  } else if (sort === 'priceAsc') {
    query += ' ORDER BY price ASC, created_at DESC';
  } else if (sort === 'priceDesc') {
    query += ' ORDER BY price DESC, created_at DESC';
  } else {
    // latest
    query += ' ORDER BY created_at DESC';
  }

  const res = await pool.query(query, params);
  return res.rows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    restaurant: row.restaurant,
    description: row.description,
    tags: row.tags || [],
    likes: row.likes,
    author: row.author,
    createdAt: row.created_at
  }));
}

async function addMenu({ name, category, price, restaurant, description, tags, author }) {
  const id = 'menu-' + Date.now();
  const validCategories = ['한식', '중식', '양식', '분식', '면종류', '일식/아시안', '기타'];
  const menuCategory = validCategories.includes(category) ? category : '한식';
  const menuPrice = Number(price) > 0 ? Number(price) : 9000;
  const menuTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean).slice(0, 5) : [];

  const res = await pool.query(`
    INSERT INTO lunch_menus (id, name, category, price, restaurant, description, tags, likes, author, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, NOW())
    RETURNING *;
  `, [
    id,
    name.trim().slice(0, 50),
    menuCategory,
    menuPrice,
    restaurant ? restaurant.trim().slice(0, 50) : '',
    description ? description.trim().slice(0, 200) : '',
    menuTags,
    author ? author.trim().slice(0, 20) : '익명'
  ]);

  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    restaurant: row.restaurant,
    description: row.description,
    tags: row.tags || [],
    likes: row.likes,
    author: row.author,
    createdAt: row.created_at
  };
}

async function likeMenu(id) {
  const res = await pool.query(`
    UPDATE lunch_menus 
    SET likes = likes + 1 
    WHERE id = $1 
    RETURNING id, likes;
  `, [id]);

  if (res.rows.length === 0) return null;
  return res.rows[0];
}

async function deleteMenu(id) {
  const res = await pool.query('DELETE FROM lunch_menus WHERE id = $1 RETURNING id;', [id]);
  return res.rows.length > 0;
}

async function getStats() {
  const totalRes = await pool.query('SELECT COUNT(*) FROM lunch_menus');
  const catRes = await pool.query('SELECT category, COUNT(*) FROM lunch_menus GROUP BY category');

  const counts = {
    '한식': 0, '중식': 0, '양식': 0, '분식': 0, '면종류': 0, '일식/아시안': 0, '기타': 0
  };

  catRes.rows.forEach(r => {
    if (counts[r.category] !== undefined) {
      counts[r.category] = parseInt(r.count, 10);
    } else {
      counts['기타'] = (counts['기타'] || 0) + parseInt(r.count, 10);
    }
  });

  return {
    totalMenus: parseInt(totalRes.rows[0].count, 10),
    counts
  };
}

// Chat Operations
async function getChats(limit = 100) {
  const res = await pool.query(`
    SELECT * FROM (
      SELECT * FROM lunch_chats 
      ORDER BY created_at DESC 
      LIMIT $1
    ) sub 
    ORDER BY created_at ASC;
  `, [limit]);

  return res.rows.map(row => ({
    id: row.id,
    nickname: row.nickname,
    message: row.message,
    time: row.time,
    avatarColor: row.avatar_color,
    isSystem: row.is_system,
    createdAt: row.created_at
  }));
}

async function addChat({ nickname, message, time, avatarColor, isSystem = false }) {
  const id = 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const now = new Date();
  const timeStr = time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const res = await pool.query(`
    INSERT INTO lunch_chats (id, nickname, message, time, avatar_color, is_system, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *;
  `, [
    id,
    (nickname || '익명의 미식가').slice(0, 20),
    message.trim().slice(0, 300),
    timeStr,
    avatarColor || '#FF6B4A',
    isSystem
  ]);

  const row = res.rows[0];
  return {
    id: row.id,
    nickname: row.nickname,
    message: row.message,
    time: row.time,
    avatarColor: row.avatar_color,
    isSystem: row.is_system,
    createdAt: row.created_at
  };
}

module.exports = {
  pool,
  initDB,
  getMenus,
  addMenu,
  likeMenu,
  deleteMenu,
  getStats,
  getChats,
  addChat
};
