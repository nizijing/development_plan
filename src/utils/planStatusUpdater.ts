import type { PlanProgress } from '../types/progress';
import type { TrainingPlan } from '../types/plan';
import { planStorage } from './planStorage';

/**
 * 检查并更新计划状态
 * @param planId 计划ID
 * @param updatedProgress 更新后的进度数据
 * @param currentPlan 当前计划
 * @returns 更新后的计划状态（如果有变更）
 */
export async function checkAndUpdatePlanStatus(
  planId: string,
  updatedProgress: PlanProgress,
  currentPlan: TrainingPlan | undefined
) {
  const allCompleted = updatedProgress.memberProgress.every(mp => mp.status === 'completed');
  const allPending = updatedProgress.memberProgress.every(mp => mp.status === 'pending');
  const hasCompleted = updatedProgress.memberProgress.some(mp => mp.status === 'completed');

  // 检查是否需要更新计划状态
  if (allCompleted) {
    await planStorage.update(planId, { status: 'completed' });
    return 'completed';
  } else if (allPending) {
    // 如果所有任务都未开始，则将计划状态改为未开始
    await planStorage.update(planId, { status: 'not_started' });
    return 'not_started';
  } else if (currentPlan?.status === 'not_started' && hasCompleted) {
    // 如果计划状态是未启动，且有任务已完成，则改为进行中
    await planStorage.update(planId, { status: 'in_progress' });
    return 'in_progress';
  } else if (currentPlan?.status === 'completed') {
    // 如果计划状态是已完成，但有任务未完成，则改为进行中
    await planStorage.update(planId, { status: 'in_progress' });
    return 'in_progress';
  }

  return null;
}
