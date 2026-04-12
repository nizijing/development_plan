// 任务完成状态
export type TaskProgressStatus = 'pending' | 'completed';

// 单个成员的任务进度
export interface MemberTaskProgress {
  personId: string;
  taskIndex: number;
  status: TaskProgressStatus;
  value: string;
}

// 整个计划的进度
export interface PlanProgress {
  id: string;
  planId: string;
  memberProgress: MemberTaskProgress[];
}

export const taskProgressLabels: Record<TaskProgressStatus, string> = {
  pending: '未完成',
  completed: '已完成',
};

export const taskProgressColors: Record<TaskProgressStatus, string> = {
  pending: '#9ca3af',
  completed: '#22c55e',
};
