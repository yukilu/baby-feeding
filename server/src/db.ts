import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'baby.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// 初始化数据库表
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount INTEGER,
      duration INTEGER,
      note TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

initDb();

export default db;
