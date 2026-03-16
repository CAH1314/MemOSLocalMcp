/**
 * MCP Server 工具实现
 */

import { MemOSDb } from './db.js';
import {
  McpTool,
  MemorySearchParams,
  MemoryGetParams,
  TaskSummaryParams,
  SkillSearchParams,
  SkillGetParams,
} from '../shared/types.js';

// 导出可用工具列表
export function getTools(): McpTool[] {
  return [
    {
      name: 'memory_search',
      description: '搜索 MemOS 本地记忆中的对话记录',
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
          minScore: {
            type: 'number',
            description: '最小相似度分数，默认 0.45',
            default: 0.45,
          },
          role: {
            type: 'string',
            enum: ['user', 'assistant', 'tool'],
            description: '按消息角色过滤',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'memory_get',
      description: '获取单条记忆的完整内容',
      inputSchema: {
        type: 'object',
        properties: {
          chunkId: {
            type: 'string',
            description: '记忆块的 ID',
          },
          maxChars: {
            type: 'number',
            description: '最大字符数，默认 4000',
            default: 4000,
          },
        },
        required: ['chunkId'],
      },
    },
    {
      name: 'task_summary',
      description: '获取任务的完整摘要信息',
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
    },
    {
      name: 'skill_search',
      description: '搜索已掌握的技能',
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
            description: '搜索范围：mix=全部，self=自己的，public=公开的',
            default: 'mix',
          },
          maxResults: {
            type: 'number',
            description: '最大返回数量，默认 10',
            default: 10,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'skill_get',
      description: '获取技能的完整内容',
      inputSchema: {
        type: 'object',
        properties: {
          skillId: {
            type: 'string',
            description: '技能 ID',
          },
          taskId: {
            type: 'string',
            description: '任务 ID（可从中获取关联技能）',
          },
        },
      },
    },
  ];
}

// 处理工具调用
export async function handleToolCall(
  db: MemOSDb,
  toolName: string,
  args: any
): Promise<any> {
  console.log(`[Tools] Calling tool: ${toolName}`, args);

  switch (toolName) {
    case 'memory_search': {
      const params = args as MemorySearchParams;
      const result = db.searchMemory(params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'memory_get': {
      const params = args as MemoryGetParams;
      const chunk = db.getMemory(params.chunkId);
      if (!chunk) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Memory not found' }),
            },
          ],
        };
      }
      // 截断内容
      const maxChars = params.maxChars || 4000;
      const content = chunk.content.length > maxChars
        ? chunk.content.substring(0, maxChars) + '...'
        : chunk.content;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ...chunk, content }, null, 2),
          },
        ],
      };
    }

    case 'task_summary': {
      const params = args as TaskSummaryParams;
      const summary = db.getTaskSummary(params.taskId);
      if (!summary) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Task not found' }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }

    case 'skill_search': {
      const params = args as SkillSearchParams;
      const skills = db.searchSkills(params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ skills }, null, 2),
          },
        ],
      };
    }

    case 'skill_get': {
      const params = args as SkillGetParams;
      const skill = db.getSkill(params);
      if (!skill) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Skill not found' }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(skill, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
