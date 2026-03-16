/**
 * 远程 MCP 工具封装
 * 将远程服务器的 MCP 工具包装成本地可调用的工具
 */

import {
  ClientConfig,
  McpRequest,
  McpResponse,
} from '../shared/types.js';

export class RemoteMcpClient {
  private serverUrl: string;
  private timeout: number;
  private autoReconnect: boolean;
  private reconnectInterval: number;
  private connected: boolean = false;
  private requestId: number = 1;

  constructor(config: ClientConfig) {
    this.serverUrl = config.serverUrl;
    this.timeout = config.timeout || 30000;
    this.autoReconnect = config.autoReconnect !== false;
    this.reconnectInterval = config.reconnectInterval || 5000;
  }

  /**
   * 发送 MCP 请求
   */
  private async request(method: string, params?: any): Promise<any> {
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params,
    };

    const response = await fetch(this.serverUrl + '/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: McpResponse = await response.json();

    if (data.error) {
      throw new Error(`MCP Error: ${data.error.message} (code: ${data.error.code})`);
    }

    return data.result;
  }

  /**
   * 初始化连接
   */
  async initialize(): Promise<void> {
    try {
      await this.request('initialize');
      this.connected = true;
      console.log('[RemoteMcp] Connected to server');
    } catch (error) {
      console.error('[RemoteMcp] Failed to initialize:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 调用远程工具
   */
  async callTool(toolName: string, args: any): Promise<any> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      const result = await this.request('tools/call', {
        name: toolName,
        arguments: args,
      });

      // 解析返回结果
      if (result?.content?.[0]?.type === 'text') {
        return JSON.parse(result.content[0].text);
      }

      return result;
    } catch (error) {
      console.error(`[RemoteMcp] Tool call failed: ${toolName}`, error);
      this.connected = false;
      throw error;
    }
  }

  // ========== 便捷方法 ==========

  /**
   * 搜索记忆
   */
  async memorySearch(query: string, maxResults = 10): Promise<any> {
    return this.callTool('memory_search', { query, maxResults });
  }

  /**
   * 获取记忆详情
   */
  async memoryGet(chunkId: string, maxChars = 4000): Promise<any> {
    return this.callTool('memory_get', { chunkId, maxChars });
  }

  /**
   * 获取任务摘要
   */
  async taskSummary(taskId: string): Promise<any> {
    return this.callTool('task_summary', { taskId });
  }

  /**
   * 搜索技能
   */
  async skillSearch(query: string, scope = 'mix', maxResults = 10): Promise<any> {
    return this.callTool('skill_search', { query, scope, maxResults });
  }

  /**
   * 获取技能详情
   */
  async skillGet(skillId?: string, taskId?: string): Promise<any> {
    return this.callTool('skill_get', { skillId, taskId });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.connected = false;
  }
}
