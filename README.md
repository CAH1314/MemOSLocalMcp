# MemOSLocalMcp

> 🚀 一键启动跨设备 MemOS 记忆共享服务

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/badge/npm-1.0.1-blue.svg)](https://www.npmjs.com/)

## ✨ 特性

- 🔌 **一键启动** - 只需一行命令即可启动 MCP Server
- 📦 **npm 安装** - 无需克隆仓库，直接 npx 使用
- 🔒 **本地存储** - 数据保存在本地 memos.db，不上传云端
- 🌐 **跨设备共享** - 局域网内其他设备都可访问

## 🚀 快速开始

### 服务端（主机）- 只需一行命令

```bash
# 方式1: 使用 npx（推荐，无需安装）
npx memos-local-mcp-server

# 方式2: 全局安装
npm install -g memos-local-mcp-server
memos-mcp-server

# 方式3: 本地安装
npm install memos-local-mcp-server
npx memos-mcp-server
```

启动后显示：

```
╔══════════════════════════════════════════╗
║  MemOS Local MCP Server                ║
║  → http://0.0.0.0:18800               ║
║  → MCP endpoint: /mcp                  ║
╚══════════════════════════════════════════╝
```

### 环境变量（可选）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MEMOS_DB_PATH` | ~/.openclaw/memos-local/memos.db | 数据库路径 |
| `SERVER_PORT` | 18800 | 服务端口 |
| `SERVER_HOST` | 0.0.0.0 | 绑定地址 |

```bash
# 自定义端口
SERVER_PORT=8888 npx memos-local-mcp-server

# 自定义数据库路径
MEMOS_DB_PATH=/path/to/memos.db npx memos-local-mcp-server
```

### 客户端（其他设备）

在 OpenClaw 插件目录安装：

```bash
# 方式1: 直接从 GitHub 安装
openclaw plugins install https://github.com/CAH1314/MemOSLocalMcp/raw/main/client.tar.gz

# 方式2: 手动安装
# 1. 下载 client 目录
# 2. 复制到 ~/.openclaw/extensions/memos-local-mcp-client/
# 3. 配置 openclaw.json
```

## 📡 API 使用

### 测试连接

```bash
# 健康检查
curl http://localhost:18800/health

# 搜索记忆
curl -X POST http://localhost:18800/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "memory_search",
      "arguments": {"query": "奶茶", "maxResults": 3}
    }
  }'
```

### 可用工具

| 工具 | 说明 |
|------|------|
| `memory_search` | 搜索记忆 |
| `memory_get` | 获取记忆详情 |
| `task_summary` | 获取任务摘要 |
| `skill_search` | 搜索技能 |
| `skill_get` | 获取技能详情 |

## 🔧 手动安装（高级）

### 服务端

```bash
# 克隆仓库
git clone https://github.com/CAH1314/MemOSLocalMcp.git
cd MemOSLocalMcp/server

# 安装依赖
npm install

# 启动服务
npm start
```

### 客户端

```bash
cd ../client
npm install
npm run build

# 复制到 OpenClaw 插件目录
cp -r dist ~/.openclaw/extensions/memos-local-mcp-client
```

配置 `~/.openclaw/openclaw.json`：

```json
{
  "plugins": {
    "entries": {
      "memos-local-mcp-client": {
        "enabled": true,
        "config": {
          "serverUrl": "http://192.168.1.100:18800"
        }
      }
    }
  }
}
```

## 🐛 常见问题

### Q: 端口被占用？

```bash
# 查看占用进程
lsof -i:18800

# 杀掉进程
kill <PID>
```

### Q: 无法连接？

1. 检查防火墙：`sudo ufw allow 18800/tcp`
2. 检查 IP 地址：`hostname -I`

## 📄 许可证

MIT License
