# MemOSLocalMcp

> 让多个 OpenClaw 实例共享本地 MemOS 记忆的 MCP 解决方案

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)

## 📖 项目简介

MemOSLocalMcp 是一个基于 MCP (Model Context Protocol) 的开源项目，旨在解决多个 OpenClaw 实例之间共享本地记忆的问题。

通过在主机上运行 MCP Server，其他设备的 OpenClaw 可以通过 MCP Client 连接到主机，查询主机上的 MemOS 记忆，实现跨设备的记忆共享。

```
┌──────────────┐  HTTP/MCP  ┌──────────────┐
│ 客户端 OpenClaw│ ◄─────────► │ MCP Server   │
│  (其他设备)    │ memory_search │  (主机)     │
└──────────────┘            └──────────────┘
                                    │
                              ┌──────┴──────┐
                              │ memos.db   │
                              │ (本地SQLite)│
                              └─────────────┘
```

## ✨ 特性

- 🔌 **MCP 协议** - 遵循标准 MCP 协议，支持多种 MCP 客户端
- 🖥️ **主机/客户端架构** - 主机提供记忆服务，客户端连接使用
- 🔒 **本地存储** - 数据保存在本地 memos.db，不上传云端
- 🚀 **快速部署** - 一键启动，简单配置
- 🔧 **TypeScript** - 完整的类型支持，易于维护

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           主机 (Server)                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  OpenClaw  │    │ MemOS 本地  │    │  MCP Server         │  │
│  │  (有记忆)   │───►│  memos.db   │───►│  :18800/mcp         │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP/MCP
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        客户端 (Client)                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  OpenClaw  │    │ MCP Client  │───►│  远程工具注册       │  │
│  │  (无记忆)   │◄───│  插件       │    │  remote_memory_*    │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 项目结构

```
MemOSLocalMcp/
├── README.md                      # 项目概述
├── LICENSE                        # MIT 许可证
├── shared/                        # 共享类型定义
│   └── types.ts                  # TypeScript 类型
├── server/                        # MCP Server (主机端)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # HTTP 服务入口
│       ├── db.ts                  # 数据库查询
│       └── tools.ts               # MCP 工具实现
└── client/                        # MCP Client (客户端)
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts               # 插件入口
        └── remote-tool.ts        # 远程工具封装
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm 或 pnpm
- 已安装 MemOS Local 插件的 OpenClaw 主机

### 步骤 1：克隆项目

```bash
git clone https://github.com/你的用户名/MemOSLocalMcp.git
cd MemOSLocalMcp
```

### 步骤 2：启动 MCP Server（主机端）

```bash
# 进入 server 目录
cd server

# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 配置环境变量（可选）
export MEMOS_DB_PATH=~/.openclaw/memos-local/memos.db
export SERVER_PORT=18800

# 启动服务
npm start
```

服务启动后显示：

```
╔══════════════════════════════════════════╗
║  MemOS Local MCP Server                ║
║  → http://0.0.0.0:18800               ║
║  → MCP endpoint: /mcp                 ║
╚══════════════════════════════════════════╝
```

### 步骤 3：配置 MCP Client（客户端）

在其他设备的 OpenClaw 上：

```bash
# 进入 client 目录
cd client

# 安装依赖
npm install

# 编译
npm run build

# 复制到 OpenClaw 插件目录
cp -r dist ~/.openclaw/extensions/memos-local-mcp-client
```

### 步骤 4：配置 OpenClaw

在 `~/.openclaw/openclaw.json` 中添加：

```json
{
  "plugins": {
    "entries": {
      "memos-local-mcp-client": {
        "enabled": true,
        "config": {
          "serverUrl": "http://192.168.1.100:18800",
          "autoReconnect": true,
          "reconnectInterval": 5000,
          "timeout": 30000
        }
      }
    }
  }
}
```

**配置说明：**

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| serverUrl | 必填 | MCP Server 地址（格式：http://IP:端口） |
| autoReconnect | true | 断线自动重连 |
| reconnectInterval | 5000 | 重连间隔（毫秒） |
| timeout | 30000 | 请求超时（毫秒） |

### 步骤 5：重启 Gateway

```bash
openclaw gateway restart
```

## 📡 MCP Server API

### 端点

```
POST http://192.168.1.100:18800/mcp
```

### 可用工具

| 工具名 | 说明 | 参数 |
|--------|------|------|
| `memory_search` | 搜索记忆 | `query`, `maxResults`, `minScore`, `role` |
| `memory_get` | 获取记忆详情 | `chunkId`, `maxChars` |
| `task_summary` | 获取任务摘要 | `taskId` |
| `skill_search` | 搜索技能 | `query`, `scope`, `maxResults` |
| `skill_get` | 获取技能详情 | `skillId`, `taskId` |

### 请求示例

```bash
# 搜索记忆
curl -X POST http://192.168.1.100:18800/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "memory_search",
      "arguments": {
        "query": "奶茶小店",
        "maxResults": 10
      }
    }
  }'
```

## 🔧 进阶配置

### 防火墙配置

如果需要从其他机器访问，需要开放端口：

```bash
# Ubuntu/Debian
sudo ufw allow 18800/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=18800/tcp
sudo firewall-cmd --reload
```

### 开机自启（Linux systemd）

创建服务文件 `/etc/systemd/system/memos-mcp.service`：

```ini
[Unit]
Description=MemOS Local MCP Server
After=network.target

[Service]
Type=simple
User=cdp
WorkingDirectory=/home/cdp/MemOSLocalMcp/server
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable memos-mcp
sudo systemctl start memos-mcp
```

### HTTPS 配置（可选）

可以使用 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name mcp.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:18800;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 🐛 常见问题

### Q1: 连接失败？

1. 检查 Server 是否启动：`curl http://192.168.1.100:18800/health`
2. 检查防火墙是否开放端口
3. 检查 serverUrl 配置是否正确

### Q2: 搜索不到记忆？

1. 确认主机上的 MemOS 已经有记忆
2. 检查查询关键词是否正确

### Q3: 客户端插件没有生效？

1. 检查 openclaw.json 配置格式是否正确
2. 重启 Gateway：`openclaw gateway restart`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议
- [MemOS](https://github.com/MemTensor/MemOS) - 本地记忆系统
- [OpenClaw](https://github.com/nicepkg/openclaw) - AI Agent 框架
