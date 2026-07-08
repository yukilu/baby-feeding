import express from 'express';
import cors from 'cors';
import path from 'path';
import db from './db';
import type { Record, CreateRecordInput, PaginatedResponse, DailyStats } from './types';

const app = express();
const PORT = parseInt(process.env.PORT || '80', 10);

app.use(cors());
app.use(express.json());

// 请求日志中间件
// app.use((req, res, next) => {
//   const params = req.method === 'GET' ? req.query : req.body;
//   console.log(`[${new Date().toLocaleString('zh-CN')}] ${req.method} ${req.path}`, JSON.stringify(params));
//   next();
// });

// 获取分页记录
app.get('/api/records', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const date = req.query.date as string;

  if (date) {
    const records = db.prepare('SELECT * FROM records WHERE createdAt LIKE ? ORDER BY createdAt ASC, id ASC').all(`${date}%`) as unknown as Record[];
    const response: PaginatedResponse<Record> = {
      data: records,
      page: 1,
      pageSize: records.length,
      total: records.length,
      totalPages: 1,
    };
    return res.json(response);
  }

  const offset = (page - 1) * pageSize;
  const records = db.prepare('SELECT * FROM records ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?').all(pageSize, offset) as unknown as Record[];
  const totalResult = db.prepare('SELECT COUNT(*) as count FROM records').get() as unknown as { count: number };
  const total = totalResult.count;
  const totalPages = Math.ceil(total / pageSize);

  const response: PaginatedResponse<Record> = {
    data: records,
    page,
    pageSize,
    total,
    totalPages,
  };

  res.json(response);
});

// 获取统计数据（按天）
app.get('/api/stats', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 7;
  const offset = (page - 1) * pageSize;

  const records = db.prepare('SELECT * FROM records ORDER BY createdAt DESC, id DESC').all() as unknown as Record[];
  
  // 按日期分组统计
  const statsMap = new Map<string, DailyStats>();
  
  records.forEach(record => {
    const date = record.createdAt.split(' ')[0]; // YYYY-MM-DD
    let stats = statsMap.get(date);
    
    if (!stats) {
      stats = {
        date,
        formulaAmount: 0,
        breastmilkAmount: 0,
        poopCount: 0,
        diaperCount: 0,
      };
      statsMap.set(date, stats);
    }
    
    switch (record.type) {
      case 'formula':
        stats.formulaAmount += record.amount || 0;
        break;
      case 'breastmilk':
        stats.breastmilkAmount += record.amount || 0;
        break;
      case 'pee':
        stats.diaperCount += record.diaper ?? 1;
        break;
      case 'poop':
        stats.poopCount += 1;
        stats.diaperCount += record.diaper ?? 1;
        break;
    }
  });
  
  // 转换为数组并按日期降序排序
  const allStats = Array.from(statsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  const total = allStats.length;
  const totalPages = Math.ceil(total / pageSize);
  const data = allStats.slice(offset, offset + pageSize);
  
  const response: PaginatedResponse<DailyStats> = {
    data,
    page,
    pageSize,
    total,
    totalPages,
  };
  
  res.json(response);
});

// 创建新记录
app.post('/api/records', (req, res) => {
  const { type, amount, duration, diaper, note, createdAt } = req.body as CreateRecordInput;
  
  if (!type) {
    return res.status(400).json({ error: '类型不能为空' });
  }
  
  // 奶量是奶粉和母乳的必填字段
  if ((type === 'formula' || type === 'breastmilk') && (amount === undefined || amount === null)) {
    return res.status(400).json({ error: '奶量不能为空' });
  }

  const stmt = db.prepare(`
    INSERT INTO records (type, amount, duration, diaper, note, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const now = new Date();
  const defaultCreatedAt = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
  const result = stmt.run(type, amount ?? null, duration ?? null, diaper ?? null, note || null, createdAt || defaultCreatedAt);
  const newRecord = db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid) as unknown as Record;
  
  res.json(newRecord);
});

// 更新记录
app.put('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const { amount, duration, diaper, note, createdAt } = req.body as Partial<CreateRecordInput>;
  
  // 先获取当前记录的类型
  const currentRecord = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as unknown as Record;
  
  if (!currentRecord) {
    return res.status(404).json({ error: '记录不存在' });
  }
  
  // 奶量是奶粉和母乳的必填字段
  if ((currentRecord.type === 'formula' || currentRecord.type === 'breastmilk') && (amount === undefined || amount === null)) {
    return res.status(400).json({ error: '奶量不能为空' });
  }
  
  const stmt = db.prepare(`
    UPDATE records
    SET amount = ?, duration = ?, diaper = ?, note = ?, createdAt = ?
    WHERE id = ?
  `);
  
  stmt.run(amount ?? null, duration ?? null, diaper ?? null, note || null, createdAt || currentRecord.createdAt, id);
  const updatedRecord = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as unknown as Record;
  
  res.json(updatedRecord);
});

// 删除记录
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM records WHERE id = ?').run(id);
  res.json({ success: true });
});

// 清空所有记录
app.delete('/api/records', (req, res) => {
  db.prepare('DELETE FROM records').run();
  res.json({ success: true });
});

// 前端静态文件服务
const staticPath = path.join(__dirname, 'static');
app.use(express.static(staticPath));
// SPA 路由 fallback
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
