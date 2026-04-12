import type { TrainingPlan } from '../types/plan';
import { fileStorage } from './fileStorage';

const STORAGE_KEY = 'training_plans.json';

export const planStorage = {
  async getAll(): Promise<TrainingPlan[]> {
    return fileStorage.read<TrainingPlan>(STORAGE_KEY);
  },

  async save(plans: TrainingPlan[]): Promise<boolean> {
    return fileStorage.write(STORAGE_KEY, plans);
  },

  async add(plan: Omit<TrainingPlan, 'id'>): Promise<TrainingPlan> {
    const plans = await this.getAll();
    const newPlan: TrainingPlan = {
      ...plan,
      type: plan.type || 'normal', // 默认类型为"普通"
      id: crypto.randomUUID(),
    };
    plans.push(newPlan);
    await this.save(plans);
    return newPlan;
  },

  async update(id: string, updates: Partial<Omit<TrainingPlan, 'id'>>): Promise<TrainingPlan | null> {
    const plans = await this.getAll();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return null;
    plans[index] = { 
      ...plans[index], 
      ...updates 
    };
    await this.save(plans);
    return plans[index];
  },

  async delete(id: string): Promise<boolean> {
    const plans = await this.getAll();
    const filtered = plans.filter(p => p.id !== id);
    if (filtered.length === plans.length) return false;
    await this.save(filtered);
    return true;
  },

  async archive(id: string): Promise<boolean> {
    const plans = await this.getAll();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return false;
    const plan = plans[index];
    plans.splice(index, 1);
    await this.save(plans);
    
    // 将计划添加到归档存储
    const { archiveStorage } = await import('./archiveStorage');
    const addResult = await archiveStorage.add(plan);
    
    // 将对应的进度数据也添加到归档存储
    const { progressStorage } = await import('./progressStorage');
    const progress = await progressStorage.getByPlanId(id);
    if (progress) {
      await archiveStorage.addProgress(progress);
      await progressStorage.deleteByPlanId(id);
    }
    
    return addResult;
  },

  async restoreFromArchive(plan: TrainingPlan): Promise<boolean> {
    const plans = await this.getAll();
    plans.push(plan);
    const saveResult = await this.save(plans);
    
    // 从归档存储中恢复对应的进度数据
    const { archiveStorage } = await import('./archiveStorage');
    const progress = await archiveStorage.restoreProgress(plan.id);
    if (progress) {
      const { progressStorage } = await import('./progressStorage');
      const progressList = await progressStorage.getAll();
      progressList.push(progress);
      await progressStorage.save(progressList);
    }
    
    return saveResult;
  },
};
