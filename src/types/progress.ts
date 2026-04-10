// 任务完成状态
export type TaskProgressStatus = 'pending' | 'in_progress' | 'completed';

// 单个成员的任务进度
export interface MemberTaskProgress {
  personId: string;
  taskIndex: number;
  status: TaskProgressStatus;
}

// 整个计划的进度
export interface PlanProgress {
  id: string;
  planId: string;
  memberProgress: MemberTaskProgress[];
  updatedAt: number;
}

export const taskProgressLabels: Record<TaskProgressStatus, string> = {
  pending: '待完成',
  in_progress: '进行中',
  completed: '已完成',
};

export const taskProgressColors: Record<TaskProgressStatus, string> = {
  pending: '#9ca3af',
  in_progress: '#f59e0b',
  completed: '#22c55e',
};
