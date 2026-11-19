const { app } = require('../api-app');
const db = require('../db');

let isDBInitialized = false;

module.exports = async (req, res) => {
  if (!isDBInitialized) {
    try {
      await db.initDB();
      isDBInitialized = true;
    } catch (err) {
      console.error('Vercel cold-start DB init error:', err);
    }
  }
  return app(req, res);
};
