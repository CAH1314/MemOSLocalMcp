# MemOSLocalMcp 开发计划

## 项目概述

让多个 OpenClaw 实例通过 MCP 协议共享本地 MemOS 记忆。

## 架构图

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

## 开发阶段

### Phase 1: MCP Server（主机端）✅ 已完成

| 文件 | 状态 | 说明 |
|------|------|------|
| `server/package.json` | ✅ | 依赖配置 |
| `server/tsconfig.json` | ✅ | TypeScript 配置 |
| `server/src/db.ts` | ✅ | 数据库查询 |
| `server/src/tools.ts` | ✅ | MCP 工具实现 |
| `server/src/index.ts` | ✅ | HTTP 服务入口 |

**功能**：
- 启动 HTTP 服务在 `:18800`
- 提供 `/mcp` 端点
- 支持 5 个工具：memory_search, memory_get, task_summary, skill_search, skill_get

### Phase 2: MCP Client 插件（客户端）✅ 已完成

| 文件 | 状态 | 说明 |
|------|------|------|
| `client/package.json` | ✅ | OpenClaw 插件配置 |
| `client/tsconfig.json` | ✅ | TypeScript 配置 |
| `client/src/remote-tool.ts` | ✅ | 远程工具封装 |
| `client/src/index.ts` | ✅ | 插件入口 |

**功能**：
- 连接到远程 MCP Server
- 注册远程工具为本地工具
- 自动重连机制

### Phase 3: 部署与配置（待完成）

#### 3.1 主机端部署

```bash
# 1. 进入 server 目录
cd MemOSLocalMcp/server

# 2. 安装依赖
npm install

# 3. 编译
npm run build

# 4. 配置环境变量
export MEMOS_DB_PATH=~/.openclaw/memos-local/memos.db
export SERVER_PORT=18800

# 5. 启动服务
npm start

# 6. 开放防火墙（如需要）
sudo ufw allow 18800/tcp
```

#### 3.2 客户端部署

```bash
# 1. 进入 client 目录
cd MemOSLocalMcp/client

# 2. 安装依赖
npm install

# 3. 编译
npm run build

# 4. 复制到 OpenClaw 插件目录
cp -r dist ~/.openclaw/extensions/memos-local-mcp-client

# 5. 配置 openclaw.json
```

#### 3.3 OpenClaw 配置

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

### Phase 4: 进阶功能（可选）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 认证机制 | ⭐⭐⭐ | API Key 验证 |
| TLS 加密 | ⭐⭐ | HTTPS |
| 多租户支持 | ⭐ | 用户隔离 |
| 性能优化 | ⭐ | 连接池、缓存 |

## 使用方式

### 主机端

1. 启动 MCP Server
2. 确保防火墙开放 18800 端口
3. 记录局域网 IP（如 192.168.1.100）

### 客户端

1. 安装 MCP Client 插件
2. 配置 serverUrl 指向主机 IP
3. 重启 OpenClaw Gateway
4. 使用 `remote_memory_search` 等工具查询

### 示例对话

```
用户: 帮我查一下之前讨论的奶茶项目
助手: (调用 remote_memory_search)
{
  "chunks": [
    {
      "content": "将军，我们讨论了 CocosNichaDemo 的客户端 API...",
      "role": "assistant",
      "score": 0.95
    }
  ]
}

是的！根据之前的讨论...
```

## 文件清单

```
MemOSLocalMcp/
├── README.md                    # 项目概述
├── shared/
│   └── types.ts                 # 共享类型定义
├── server/                      # MCP Server (主机)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # 服务入口
│       ├── db.ts                # 数据库查询
│       └── tools.ts             # 工具实现
└── client/                      # MCP Client (客户端)
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts             # 插件入口
        └── remote-tool.ts      # 远程工具封装
```

## 下一步行动

1. **编译 Server** → 在主机上运行
2. **编译 Client** → 部署到其他设备
3. **配置连接** → 测试跨设备记忆查询
