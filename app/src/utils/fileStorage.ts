import { invoke } from '@tauri-apps/api/core';

// 检查是否在 Tauri 环境中运行（Tauri 2 使用 __TAURI_INTERNALS__）
const isTauri = () => {
  return typeof window !== 'undefined' && 
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
};

// 通用文件存储服务
export const fileStorage = {
  async read<T>(filename: string): Promise<T[]> {
    // 如果在 Tauri 环境中
    if (isTauri()) {
      try {
        const content = await invoke<string>('read_file', { filename });
        const data = JSON.parse(content);
        
        // 如果文件为空，检查 localStorage 中是否有旧数据需要迁移
        if (data.length === 0) {
          const localData = localStorage.getItem(filename);
          if (localData) {
            const migratedData = JSON.parse(localData);
            if (migratedData.length > 0) {
              // 迁移数据到文件系统
              await invoke('write_file', { 
                filename, 
                content: JSON.stringify(migratedData, null, 2) 
              });
              // 清除 localStorage 中的旧数据
              localStorage.removeItem(filename);
              console.log(`Migrated ${migratedData.length} items from localStorage to file: ${filename}`);
              return migratedData;
            }
          }
        }
        return data;
      } catch (error) {
        console.error('Failed to read file:', error);
        return [];
      }
    }
    
    // 非 Tauri 环境，使用 localStorage
    const data = localStorage.getItem(filename);
    return data ? JSON.parse(data) : [];
  },

  async write<T>(filename: string, data: T[]): Promise<boolean> {
    // 如果在 Tauri 环境中
    if (isTauri()) {
      try {
        await invoke('write_file', { 
          filename, 
          content: JSON.stringify(data, null, 2) 
        });
        return true;
      } catch (error) {
        console.error('Failed to write file:', error);
        return false;
      }
    }
    
    // 非 Tauri 环境，使用 localStorage
    localStorage.setItem(filename, JSON.stringify(data));
    return true;
  },
};
