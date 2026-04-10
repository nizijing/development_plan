import type { PlanProgress, MemberTaskProgress, TaskProgressStatus } from '../types/progress';
import { fileStorage } from './fileStorage';

const STORAGE_KEY = 'plan_progress.json';

export const progressStorage = {
  async getAll(): Promise<PlanProgress[]> {
    return fileStorage.read<PlanProgress>(STORAGE_KEY);
  },

  async save(progressList: PlanProgress[]): Promise<boolean> {
    return fileStorage.write(STORAGE_KEY, progressList);
  },

  async getByPlanId(planId: string): Promise<PlanProgress | null> {
    const progressList = await this.getAll();
    return progressList.find(p => p.planId === planId) || null;
  },

  // 初始化计划的进度（如果不存在）
  async initPlanProgress(planId: string, participantIds: string[], taskCount: number): Promise<PlanProgress> {
    const existing = await this.getByPlanId(planId);
    if (existing) return existing;

    const memberProgress: MemberTaskProgress[] = [];
    participantIds.forEach(personId => {
      for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
        memberProgress.push({
          personId,
          taskIndex,
          status: 'pending',
        });
      }
    });

    const newProgress: PlanProgress = {
      id: crypto.randomUUID(),
      planId,
      memberProgress,
      updatedAt: Date.now(),
    };

    const progressList = await this.getAll();
    progressList.push(newProgress);
    await this.save(progressList);
    return newProgress;
  },

  // 更新某个成员在某个任务上的状态
  async updateTaskStatus(
    planId: string,
    personId: string,
    taskIndex: number,
    status: TaskProgressStatus
  ): Promise<PlanProgress | null> {
    const progressList = await this.getAll();
    const progressIndex = progressList.findIndex(p => p.planId === planId);
    if (progressIndex === -1) return null;

    const memberIndex = progressList[progressIndex].memberProgress.findIndex(
      m => m.personId === personId && m.taskIndex === taskIndex
    );
    if (memberIndex === -1) return null;

    progressList[progressIndex].memberProgress[memberIndex].status = status;
    progressList[progressIndex].updatedAt = Date.now();
    await this.save(progressList);
    return progressList[progressIndex];
  },

  // 删除计划相关的进度
  async deleteByPlanId(planId: string): Promise<boolean> {
    const progressList = await this.getAll();
    const filtered = progressList.filter(p => p.planId !== planId);
    if (filtered.length === progressList.length) return false;
    await this.save(filtered);
    return true;
  },
};
