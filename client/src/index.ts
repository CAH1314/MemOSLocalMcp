/**
 * MemOS Local MCP Client Plugin
 * OpenClaw 插件 - 连接到远程 MCP Server
 */

import { RemoteMcpClient } from './remote-tool.js';
import { ClientConfig } from '../shared/types.js';

// 插件元数据
export const pluginInfo = {
  id: 'memos-local-mcp-client',
  name: 'MemOS Local MCP Client',
  version: '1.0.0',
  description: '连接远程 MemOS MCP Server 实现记忆共享',
  author: 'PiPiXia',
};

export class MemOSLocalMcpPlugin {
  private client: RemoteMcpClient | null = null;
  private config: ClientConfig | null = null;

  /**
   * 初始化插件
   */
  async init(config: ClientConfig): Promise<void> {
    this.config = config;
    this.client = new RemoteMcpClient(config);
    
    try {
      await this.client.initialize();
      console.log(`[${pluginInfo.name}] Connected to ${config.serverUrl}`);
    } catch (error) {
      console.error(`[${pluginInfo.name}] Failed to connect:`, error);
      throw error;
    }
  }

  /**
   * 获取远程记忆搜索工具
   * 供 OpenClaw 注册为本地工具
   */
  getTools() {
    if (!this.client) {
      throw new Error('Plugin not initialized');
    }

    return [
      {
        name: 'remote_memory_search',
        description: '搜索远程主机上的 MemOS 记忆（跨设备共享记忆）',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '搜索关键词',
            },
            maxResults: {
              type: 'number',
              description: '最大返回数量，默认 10',
              default: 10,
            },
          },
          required: ['query'],
        },
        handler: async (args: any) => {
          const result = await this.client!.memorySearch(args.query, args.maxResults);
          return JSON.stringify(result, null, 2);
        },
      },
      {
        name: 'remote_memory_get',
        description: '获取远程记忆的完整内容',
        inputSchema: {
          type: 'object',
          properties: {
            chunkId: {
              type: 'string',
              description: '记忆块 ID',
            },
          },
          required: ['chunkId'],
        },
        handler: async (args: any) => {
          const result = await this.client!.memoryGet(args.chunkId);
          return JSON.stringify(result, null, 2);
        },
      },
      {
        name: 'remote_task_summary',
        description: '获取远程任务摘要',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: '任务 ID',
            },
          },
          required: ['taskId'],
        },
        handler: async (args: any) => {
          const result = await this.client!.taskSummary(args.taskId);
          return JSON.stringify(result, null, 2);
        },
      },
      {
        name: 'remote_skill_search',
        description: '搜索远程主机上的技能',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '搜索关键词',
            },
            scope: {
              type: 'string',
              enum: ['mix', 'self', 'public'],
              description: '搜索范围',
              default: 'mix',
            },
          },
          required: ['query'],
        },
        handler: async (args: any) => {
          const result = await this.client!.skillSearch(args.query, args.scope);
          return JSON.stringify(result, null, 2);
        },
      },
    ];
  }

  /**
   * 关闭插件
   */
  async destroy(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }
}

// 导出默认实例创建函数（OpenClaw 插件入口）
export async function createPlugin(config: any): Promise<MemOSLocalMcpPlugin> {
  const plugin = new MemOSLocalMcpPlugin();
  await plugin.init(config);
  return plugin;
}
