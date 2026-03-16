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
export interface ServerConfig {
    dbPath: string;
    port: number;
    host: string;
}
export interface ClientConfig {
    serverUrl: string;
    autoReconnect: boolean;
    reconnectInterval: number;
    timeout: number;
}
export declare const ERROR_CODES: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly SERVER_ERROR: -32000;
};
export declare const TOOL_NAMES: {
    readonly MEMORY_SEARCH: "memory_search";
    readonly MEMORY_GET: "memory_get";
    readonly MEMORY_TIMELINE: "memory_timeline";
    readonly TASK_SUMMARY: "task_summary";
    readonly SKILL_SEARCH: "skill_search";
    readonly SKILL_GET: "skill_get";
};
//# sourceMappingURL=types.d.ts.map