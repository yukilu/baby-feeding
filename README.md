# 宝宝喂养记录

一个用于记录宝宝奶粉、母乳以及大小便的移动端H5应用。

## 技术栈

- 前端：React + TypeScript + Vite
- 后端：Node.js + TypeScript + Express
- 数据库：SQLite3（better-sqlite3）

## 项目结构

```
baby/
├── client/          # 前端React应用
├── server/          # 后端Node.js服务
└── package.json     # 根项目配置
```

## 安装和运行

1. 安装所有依赖：

```bash
npm run install:all
```

2. 同时启动后端和前端服务：

```bash
npm run dev
```

3. 或者分别启动：

   - 后端：`cd server && npm run dev`（运行在 http://localhost:4000）
   - 前端：`cd client && npm run dev`（运行在 http://localhost:3000）

## 功能

- 🍼 记录奶粉喂养（奶量）
- 🤱 记录母乳喂养（时长）
- 💧 记录小便
- 💩 记录大便
- 查看历史记录
- 删除记录
