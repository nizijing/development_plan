import type { TrainingPlan } from '../types/plan';
import type { PlanProgress } from '../types/progress';
import { fileStorage } from './fileStorage';

const ARCHIVE_STORAGE_KEY = 'archived_training_plans.json';
const ARCHIVE_PROGRESS_KEY = 'archived_plan_progress.json';

export const archiveStorage = {
  // 归档计划相关方法
  async getAll(): Promise<TrainingPlan[]> {
    return fileStorage.read<TrainingPlan>(ARCHIVE_STORAGE_KEY);
  },

  async save(plans: TrainingPlan[]): Promise<boolean> {
    return fileStorage.write(ARCHIVE_STORAGE_KEY, plans);
  },

  async add(plan: TrainingPlan): Promise<boolean> {
    const plans = await this.getAll();
    plans.push(plan);
    return this.save(plans);
  },

  async delete(id: string): Promise<boolean> {
    const plans = await this.getAll();
    const filtered = plans.filter(p => p.id !== id);
    if (filtered.length === plans.length) return false;
    await this.save(filtered);
    
    // 同时删除对应的归档进度数据
    const progressList = await this.getAllProgress();
    const filteredProgress = progressList.filter(p => p.planId !== id);
    await this.saveProgress(filteredProgress);
    
    return true;
  },

  async restore(id: string): Promise<TrainingPlan | null> {
    const plans = await this.getAll();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return null;
    const plan = plans[index];
    plans.splice(index, 1);
    await this.save(plans);
    return plan;
  },

  // 归档进度相关方法
  async getAllProgress(): Promise<PlanProgress[]> {
    return fileStorage.read<PlanProgress>(ARCHIVE_PROGRESS_KEY);
  },

  async saveProgress(progressList: PlanProgress[]): Promise<boolean> {
    return fileStorage.write(ARCHIVE_PROGRESS_KEY, progressList);
  },

  async addProgress(progress: PlanProgress): Promise<boolean> {
    const progressList = await this.getAllProgress();
    progressList.push(progress);
    return this.saveProgress(progressList);
  },

  async getProgressByPlanId(planId: string): Promise<PlanProgress | null> {
    const progressList = await this.getAllProgress();
    return progressList.find(p => p.planId === planId) || null;
  },

  async deleteProgressByPlanId(planId: string): Promise<boolean> {
    const progressList = await this.getAllProgress();
    const filtered = progressList.filter(p => p.planId !== planId);
    if (filtered.length === progressList.length) return false;
    await this.saveProgress(filtered);
    return true;
  },

  async restoreProgress(planId: string): Promise<PlanProgress | null> {
    const progressList = await this.getAllProgress();
    const index = progressList.findIndex(p => p.planId === planId);
    if (index === -1) return null;
    const progress = progressList[index];
    progressList.splice(index, 1);
    await this.saveProgress(progressList);
    return progress;
  },
};
