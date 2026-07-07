import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, 'baby.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');

// 初始化数据库表
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount INTEGER,
      duration INTEGER,
      diaper INTEGER,
      note TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // 兼容旧数据库，添加 diaper 列（如已存在则跳过）
  try { db.exec('ALTER TABLE records ADD COLUMN diaper INTEGER'); } catch {}
};

initDb();

export default db;
