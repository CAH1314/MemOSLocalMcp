/**
 * MemOS 数据库查询模块
 * 直接读取本地 memos.db
 * 
 * 注意：根据实际 memos.db schema 编写
 */

import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import {
  MemorySearchParams,
  MemorySearchResult,
  MemoryChunk,
  TaskSummary,
  SkillInfo,
  SkillSearchParams,
  SkillGetParams,
} from './shared-types.js';

export class MemOSDb {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // 默认路径
    const defaultPath = path.join(os.homedir(), '.openclaw', 'memos-local', 'memos.db');
    const actualPath = dbPath || defaultPath;

    console.log(`[MemOSDb] Opening database: ${actualPath}`);
    this.db = new Database(actualPath, { readonly: true });
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * 搜索记忆
   */
  searchMemory(params: MemorySearchParams): MemorySearchResult {
    const { query, maxResults = 10, role } = params;

    // 使用 LIKE 关键词搜索（简化版MVP）
    let sql = `
      SELECT 
        c.id as chunkId,
        c.content,
        c.role,
        c.task_id,
        c.created_at,
        0.8 as score
      FROM chunks c
      WHERE c.content LIKE ?
    `;

    const searchPattern = `%${query}%`;
    const paramsList: any[] = [searchPattern];

    if (role) {
      sql += ` AND c.role = ?`;
      paramsList.push(role);
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ?`;
    paramsList.push(maxResults);

    const rows = this.db.prepare(sql).all(...paramsList);

    const chunks: MemoryChunk[] = rows.map((row: any) => ({
      chunkId: row.chunkId,
      content: row.content,
      role: row.role,
      taskId: row.task_id || undefined,
      score: row.score,
      createdAt: row.created_at,
    }));

    return { chunks, total: chunks.length };
  }

  /**
   * 获取记忆详情
   */
  getMemory(chunkId: string): MemoryChunk | null {
    const sql = `
      SELECT 
        id as chunkId,
        content,
        role,
        task_id,
        created_at,
        0.8 as score
      FROM chunks
      WHERE id = ?
    `;

    const row = this.db.prepare(sql).get(chunkId) as any;

    if (!row) return null;

    return {
      chunkId: row.chunkId,
      content: row.content,
      role: row.role,
      taskId: row.task_id || undefined,
      score: row.score,
      createdAt: row.created_at,
    };
  }

  /**
   * 获取任务摘要
   */
  getTaskSummary(taskId: string): TaskSummary | null {
    const sql = `
      SELECT 
        id,
        title,
        status,
        summary
      FROM tasks
      WHERE id = ?
    `;

    const row = this.db.prepare(sql).get(taskId) as any;

    if (!row) return null;

    let summary = { goal: '', keySteps: [], result: '', keyDetails: [] };
    if (row.summary) {
      try {
        summary = JSON.parse(row.summary);
      } catch (e) {
        // ignore
      }
    }

    return {
      taskId: row.id,
      title: row.title,
      status: row.status,
      summary,
    };
  }

  /**
   * 搜索技能
   */
  searchSkills(params: SkillSearchParams): SkillInfo[] {
    const { query, scope = 'self', maxResults = 10 } = params;

    let sql = `
      SELECT 
        s.id as skillId,
        s.name,
        s.description,
        s.quality_score as qualityScore,
        s.visibility,
        s.created_at as createdAt
      FROM skills s
      WHERE s.description LIKE ?
    `;

    const searchPattern = `%${query}%`;
    const paramsList: any[] = [searchPattern];

    if (scope !== 'mix') {
      sql += ` AND s.visibility = ?`;
      paramsList.push(scope === 'public' ? 'public' : 'private');
    }

    sql += ` ORDER BY s.quality_score DESC, s.created_at DESC LIMIT ?`;
    paramsList.push(maxResults);

    const rows = this.db.prepare(sql).all(...paramsList);

    return rows.map((row: any) => ({
      skillId: row.skillId,
      name: row.name,
      description: row.description,
      qualityScore: row.qualityScore || 0,
      visibility: row.visibility,
      versions: [],
    }));
  }

  /**
   * 获取技能详情
   */
  getSkill(params: SkillGetParams): SkillInfo | null {
    let { skillId, taskId } = params;

    if (taskId) {
      // 通过 taskId 查找关联的 skill
      const sql = `
        SELECT s.id as skillId
        FROM skills s
        WHERE s.name IN (
          SELECT title FROM tasks WHERE id = ?
        )
        LIMIT 1
      `;
      const row = this.db.prepare(sql).get(taskId) as any;
      if (row) {
        skillId = row.skillId;
      }
    }

    if (!skillId) return null;

    const sql = `
      SELECT 
        id as skillId,
        name,
        description,
        quality_score as qualityScore,
        visibility,
        created_at as createdAt
      FROM skills
      WHERE id = ?
    `;

    const row = this.db.prepare(sql).get(skillId) as any;

    if (!row) return null;

    return {
      skillId: row.skillId,
      name: row.name,
      description: row.description,
      qualityScore: row.qualityScore || 0,
      visibility: row.visibility,
      versions: [],
    };
  }

  close() {
    this.db.close();
  }
}
