import type { PlanStatus, TrainingPlan } from '../types/plan';
import { statusColors } from '../types/plan';
import type { PlanProgress, MemberTaskProgress } from '../types/progress';

/**
 * 获取指定成员的任务进度
 * @param progressMap 进度数据映射
 * @param planId 计划ID
 * @param personId 人员ID
 * @returns 成员的任务进度数组
 */
export function getMemberProgress(
  progressMap: Record<string, PlanProgress>,
  planId: string,
  personId: string
): MemberTaskProgress[] {
  const progress = progressMap[planId];
  if (!progress) return [];
  return progress.memberProgress.filter(m => m.personId === personId);
}

/**
 * 获取成员的进度统计信息
 * @param progressMap 进度数据映射
 * @param planId 计划ID
 * @param personId 人员ID
 * @returns 进度统计信息，包含总数、完成数和百分比
 */
export function getProgressStats(
  progressMap: Record<string, PlanProgress>,
  planId: string,
  personId: string
) {
  const memberProgress = getMemberProgress(progressMap, planId, personId);
  const total = memberProgress.length;
  const completed = memberProgress.filter(m => m.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

/**
 * 获取计划的总体进度
 * @param progressMap 进度数据映射
 * @param planId 计划ID
 * @returns 总体进度统计信息
 */
export function getOverallProgress(
  progressMap: Record<string, PlanProgress>,
  planId: string
) {
  const progress = progressMap[planId];
  if (!progress) return { total: 0, completed: 0, percentage: 0 };
  const total = progress.memberProgress.length;
  const completed = progress.memberProgress.filter(m => m.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

/**
 * 获取状态标签的样式
 * @param status 计划状态
 * @returns 样式对象
 */
export function getStatusBadgeStyle(status: PlanStatus) {
  return {
    backgroundColor: statusColors[status],
    color: 'white',
  };
}

/**
 * 按状态分组排序计划：进行中 > 未开始 > 已完成
 * @param plans 计划数组
 * @returns 排序后的计划数组
 */
export function sortPlansByStatus(plans: TrainingPlan[]): TrainingPlan[] {
  return [...plans].sort((a, b) => {
    const order: PlanStatus[] = ['in_progress', 'not_started', 'completed'];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });
}

