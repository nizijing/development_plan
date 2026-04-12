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

  // 初始化计划的进度（如果不存在），并确保所有参与人员都有任务进度
  async initPlanProgress(planId: string, participantIds: string[], taskCount: number): Promise<PlanProgress> {
    const existing = await this.getByPlanId(planId);
    
    if (existing) {
      // 检查是否有新添加的人员或任务数量变化
      const existingPersonIds = new Set(existing.memberProgress.map(mp => mp.personId));
      const newPersonIds = participantIds.filter(id => !existingPersonIds.has(id));
      
      // 检查任务数量是否变化
      const existingTaskCount = existing.memberProgress.length > 0 ? 
        Math.max(...existing.memberProgress.map(mp => mp.taskIndex)) + 1 : 0;
      const taskCountChanged = existingTaskCount !== taskCount;
      
      // 过滤掉不再是参与者的人员的进度
      const filteredByParticipants = existing.memberProgress.filter(mp => participantIds.includes(mp.personId));
      
      // 为新人员添加任务进度
      newPersonIds.forEach(personId => {
        for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
          filteredByParticipants.push({
            personId,
            taskIndex,
            status: 'pending',
            value: '',
          });
        }
      });
      
      // 如果任务数量变化，更新所有人员的任务进度
      if (taskCountChanged) {
        // 过滤掉超出新任务数量的进度
        const filteredProgress = filteredByParticipants.filter(mp => mp.taskIndex < taskCount);
        
        // 为所有人员添加新任务的进度
        participantIds.forEach(personId => {
          for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
            const exists = filteredProgress.some(mp => mp.personId === personId && mp.taskIndex === taskIndex);
            if (!exists) {
              filteredProgress.push({
                personId,
                taskIndex,
                status: 'pending',
                value: '',
              });
            }
          }
        });
        
        existing.memberProgress = filteredProgress;
      } else {
        existing.memberProgress = filteredByParticipants;
      }
      

      
      // 保存更新后的进度
      const progressList = await this.getAll();
      const index = progressList.findIndex(p => p.planId === planId);
      if (index !== -1) {
        progressList[index] = existing;
        await this.save(progressList);
      }
      
      return existing;
    }

    // 如果进度不存在，创建新的进度
    const memberProgress: MemberTaskProgress[] = [];
    participantIds.forEach(personId => {
      for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
        memberProgress.push({
          personId,
          taskIndex,
          status: 'pending',
          value: '',
        });
      }
    });

    const newProgress: PlanProgress = {
      id: crypto.randomUUID(),
      planId,
      memberProgress,
    };

    const progressList = await this.getAll();
    progressList.push(newProgress);
    await this.save(progressList);
    return newProgress;
  },

  // 更新某个成员在某个任务上的状态和值
  async updateTaskStatus(
    planId: string,
    personId: string,
    taskIndex: number,
    status: TaskProgressStatus,
    value?: string
  ): Promise<PlanProgress | null> {
    const progressList = await this.getAll();
    const progressIndex = progressList.findIndex(p => p.planId === planId);
    if (progressIndex === -1) return null;

    const memberIndex = progressList[progressIndex].memberProgress.findIndex(
      m => m.personId === personId && m.taskIndex === taskIndex
    );
    if (memberIndex === -1) return null;

    progressList[progressIndex].memberProgress[memberIndex].status = status;
    if (value !== undefined) {
      progressList[progressIndex].memberProgress[memberIndex].value = value;
    }
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
