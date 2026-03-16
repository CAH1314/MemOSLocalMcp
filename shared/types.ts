/**
 * MemOSLocalMcp 共享类型定义
 */

export interface McpRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: McpError;
}

export interface McpError {
  code: number;
  message: string;
  data?: any;
}

// ========== 工具相关类型 ==========

export interface McpTool {
  name: string;
  description: string;
  inputSchema: McpToolSchema;
}

export interface McpToolSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
}

// ========== Memory 工具参数 ==========

export interface MemorySearchParams {
  query: string;
  maxResults?: number;
  minScore?: number;
  role?: 'user' | 'assistant' | 'tool';
}

export interface MemoryGetParams {
  chunkId: string;
  maxChars?: number;
}

export interface TaskSummaryParams {
  taskId: string;
}

export interface SkillSearchParams {
  query: string;
  scope?: 'mix' | 'self' | 'public';
  maxResults?: number;
}

export interface SkillGetParams {
  skillId?: string;
  taskId?: string;
}

// ========== Memory 返回类型 ==========

export interface MemorySearchResult {
  chunks: MemoryChunk[];
  total: number;
}

export interface MemoryChunk {
  chunkId: string;
  content: string;
  role: string;
  taskId?: string;
  score: number;
  createdAt: string;
}

export interface TaskSummary {
  taskId: string;
  title: string;
  status: 'active' | 'completed' | 'skipped';
  summary: {
    goal: string;
    keySteps: string[];
    result: string;
    keyDetails: string[];
  };
}

export interface SkillInfo {
  skillId: string;
  name: string;
  description: string;
  qualityScore: number;
  visibility: 'private' | 'public';
  versions: SkillVersion[];
}

export interface SkillVersion {
  version: string;
  content: string;
  createdAt: string;
  changeSummary: string;
}

// ========== Server 配置 ==========

export interface ServerConfig {
  dbPath: string;
  port: number;
  host: string;
}

// ========== Client 配置 ==========

export interface ClientConfig {
  serverUrl: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  timeout: number;
}

// ========== 常量 ==========

export const ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
} as const;

export const TOOL_NAMES = {
  MEMORY_SEARCH: 'memory_search',
  MEMORY_GET: 'memory_get',
  MEMORY_TIMELINE: 'memory_timeline',
  TASK_SUMMARY: 'task_summary',
  SKILL_SEARCH: 'skill_search',
  SKILL_GET: 'skill_get',
} as const;
