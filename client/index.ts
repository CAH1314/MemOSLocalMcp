/**
 * MemOSLocalMcp - OpenClaw Plugin Entry
 * 连接到远程 MCP Server 实现记忆共享
 */

import { MemOSLocalMcpPlugin } from './dist/plugin.js';

export default {
  /**
   * 插件加载时调用
   */
  async load(context: any) {
    console.log('[MemOSLocalMcp] Loading plugin...');
    
    const config = context.config || {};
    const plugin = new MemOSLocalMcpPlugin();
    
    await plugin.init(config);
    
    // 注册工具到 OpenClaw
    const tools = plugin.getTools();
    for (const tool of tools) {
      context.registerTool(tool.name, tool.description, tool.inputSchema, tool.handler);
    }
    
    // 保存插件实例
    context.pluginInstance = plugin;
    
    console.log('[MemOSLocalMcp] Plugin loaded successfully');
  },

  /**
   * 插件卸载时调用
   */
  async unload(context: any) {
    console.log('[MemOSLocalMcp] Unloading plugin...');
    
    if (context.pluginInstance) {
      await context.pluginInstance.destroy();
    }
    
    console.log('[MemOSLocalMcp] Plugin unloaded');
  },
};
