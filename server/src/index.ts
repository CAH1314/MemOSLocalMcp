/**
 * MemOS Local MCP Server
 * 主机端：提供远程记忆查询服务
 */

import express from 'express';
import { MemOSDb } from './db.js';
import { getTools, handleToolCall } from './tools.js';
import { McpRequest, McpResponse, ERROR_CODES } from './shared-types.js';

const app = express();
app.use(express.json());

// 环境变量配置
const config = {
  dbPath: process.env.MEMOS_DB_PATH,
  port: parseInt(process.env.SERVER_PORT || '18800'),
  host: process.env.SERVER_HOST || '0.0.0.0',
};

// 初始化数据库
let db: MemOSDb;
try {
  db = new MemOSDb(config.dbPath);
  console.log('[Server] Database connected');
} catch (error) {
  console.error('[Server] Failed to connect database:', error);
  process.exit(1);
}

// MCP 协议处理
function createResponse(id: number | string, result?: any, error?: any): McpResponse {
  const response: McpResponse = {
    jsonrpc: '2.0',
    id,
  };
  
  if (error) {
    response.error = {
      code: error.code || ERROR_CODES.INTERNAL_ERROR,
      message: error.message,
      data: error.data,
    };
  } else {
    response.result = result;
  }
  
  return response;
}

// MCP 端点
app.post('/mcp', async (req, res) => {
  const request = req.body as McpRequest;
  const id = request.id || 1;
  
  console.log(`[MCP] Received: ${request.method}`);
  
  try {
    // 处理不同 MCP 方法
    switch (request.method) {
      case 'initialize': {
        // 返回服务器能力
        const result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'MemOSLocalMcp-Server',
            version: '1.0.0',
          },
        };
        res.json(createResponse(id, result));
        break;
      }
      
      case 'tools/list': {
        const tools = getTools();
        const result = { tools };
        res.json(createResponse(id, result));
        break;
      }
      
      case 'tools/call': {
        const { name, arguments: args } = request.params || {};
        
        if (!name) {
          res.json(createResponse(id, undefined, {
            code: ERROR_CODES.INVALID_PARAMS,
            message: 'Tool name is required',
          }));
          return;
        }
        
        const result = await handleToolCall(db, name, args);
        res.json(createResponse(id, result));
        break;
      }
      
      default: {
        res.json(createResponse(id, undefined, {
          code: ERROR_CODES.METHOD_NOT_FOUND,
          message: `Method not found: ${request.method}`,
        }));
      }
    }
  } catch (error: any) {
    console.error('[MCP] Error:', error);
    res.json(createResponse(id, undefined, {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'Internal error',
    }));
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(config.port, config.host, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  MemOS Local MCP Server                  ║
║  → http://${config.host}:${config.port}               ║
║  → MCP endpoint: /mcp                   ║
╚══════════════════════════════════════════╝
  `);
});

// 优雅退出
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  db.close();
  process.exit(0);
});
