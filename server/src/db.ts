/**
 * MemOS 数据库查询模块
 * 直接读取本地 memos.db
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
} from '../shared/types.js';

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
    const { query, maxResults = 10, minScore = 0.45, role } = params;

    // 使用 FTS5 全文搜索 + 向量相似度
    // 这里简化为关键词搜索
    const sql = `
      SELECT 
        c.chunk_id as chunkId,
        c.content,
        c.role,
        c.task_id as taskId,
        c.created_at as createdAt,
        0.8 as score
      FROM chunks c
      LEFT JOIN tasks t ON c.task_id = t.task_id
      WHERE c.content LIKE ?
        ${role ? 'AND c.role = ?' : ''}
        AND (t.status IS NULL OR t.status = 'completed')
      ORDER BY c.created_at DESC
      LIMIT ?
    `;

    const searchPattern = `%${query}%`;
    const stmt = role
      ? this.db.prepare(sql)
      : this.db.prepare(sql.replace(' AND (t.status IS NULL OR t.status = \'completed\')', ''));

    const rows = role
      ? stmt.all(searchPattern, role, maxResults)
      : stmt.all(searchPattern, maxResults);

    const chunks: MemoryChunk[] = rows.map((row: any) => ({
      chunkId: row.chunkId,
      content: row.content,
      role: row.role,
      taskId: row.taskId || undefined,
      score: row.score,
      createdAt: row.createdAt,
    }));

    return { chunks, total: chunks.length };
  }

  /**
   * 获取记忆详情
   */
  getMemory(chunkId: string): MemoryChunk | null {
    const sql = `
      SELECT 
        chunk_id as chunkId,
        content,
        role,
        task_id as taskId,
        created_at as createdAt,
        0.8 as score
      FROM chunks
      WHERE chunk_id = ?
    `;

    const row = this.db.prepare(sql).get(chunkId) as any;

    if (!row) return null;

    return {
      chunkId: row.chunkId,
      content: row.content,
      role: row.role,
      taskId: row.taskId || undefined,
      score: row.score,
      createdAt: row.createdAt,
    };
  }

  /**
   * 获取任务摘要
   */
  getTaskSummary(taskId: string): TaskSummary | null {
    const sql = `
      SELECT 
        task_id as taskId,
        title,
        status,
        summary
      FROM tasks
      WHERE task_id = ?
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
      taskId: row.taskId,
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

    const sql = `
      SELECT 
        s.skill_id as skillId,
        s.name,
        s.description,
        s.quality_score as qualityScore,
        s.visibility,
        s.created_at as createdAt
      FROM skills s
      WHERE s.description LIKE ?
        ${scope !== 'mix' ? 'AND s.visibility = ?' : ''}
      ORDER BY s.quality_score DESC, s.created_at DESC
      LIMIT ?
    `;

    const searchPattern = `%${query}%`;
    const visibility = scope === 'public' ? 'public' : (scope === 'self' ? 'private' : null);

    const rows = visibility
      ? this.db.prepare(sql).all(searchPattern, visibility, maxResults)
      : this.db.prepare(sql.replace(' AND s.visibility = ?', '')).all(searchPattern, maxResults);

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
    const { skillId, taskId } = params;

    if (taskId) {
      // 通过 taskId 查找关联的 skill
      const sql = `
        SELECT s.skill_id as skillId
        FROM skills s
        JOIN tasks t ON t.task_id = ?
        WHERE s.name LIKE '%' || t.title || '%'
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
        s.skill_id as skillId,
        s.name,
        s.description,
        s.quality_score as qualityScore,
        s.visibility,
        s.created_at as createdAt
      FROM skills s
      WHERE s.skill_id = ?
    `;

    const row = this.db.prepare(sql).get(skillId) as any;

    if (!row) return null;

    // 获取版本历史
    const versionsSql = `
      SELECT 
        version,
        content,
        created_at as createdAt,
        change_summary as changeSummary
      FROM skill_versions
      WHERE skill_id = ?
      ORDER BY created_at DESC
    `;
    const versions = this.db.prepare(versionsSql).all(skillId);

    return {
      skillId: row.skillId,
      name: row.name,
      description: row.description,
      qualityScore: row.qualityScore || 0,
      visibility: row.visibility,
      versions: versions,
    };
  }

  close() {
    this.db.close();
  }
}
