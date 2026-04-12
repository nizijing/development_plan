export type PlanStatus = 'not_started' | 'in_progress' | 'completed';
export type PlanType = 'normal' | 'advance' ;

export interface TrainingPlan {
  id: string;
  name: string; // 计划名
  tasks: string[]; // 培养任务列表
  participantIds: string[]; // 参与人员ID列表
  status: PlanStatus;
  type: PlanType; 
}

export const statusLabels: Record<PlanStatus, string> = {
  not_started: '未启动',
  in_progress: '进行中',
  completed: '已完成',
};

export const statusColors: Record<PlanStatus, string> = {
  not_started: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#22c55e',
};
