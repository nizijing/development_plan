import { useState, useEffect, useCallback } from 'react';
import type { TrainingPlan } from '../types/plan';
import { statusLabels } from '../types/plan';
import type { Person } from '../types/person';
import type { PlanProgress, TaskProgressStatus } from '../types/progress';
import { taskProgressLabels } from '../types/progress';
import { planStorage } from '../utils/planStorage';
import { personStorage } from '../utils/personStorage';
import { progressStorage } from '../utils/progressStorage';
import { checkAndUpdatePlanStatus } from '../utils/planStatusUpdater';
import { getMemberProgress, getProgressStats, getOverallProgress, getStatusBadgeStyle, sortPlansByStatus } from '../utils/progressHelpers';
import './ProgressViewer.css';

/**
 * 普通进度查看器组件
 * 用于展示和管理普通类型培养计划的进度
 */
export function ProgressViewer() {
  // 状态管理
  const [plans, setPlans] = useState<TrainingPlan[]>([]); // 培养计划列表
  const [persons, setPersons] = useState<Person[]>([]); // 人员列表
  const [progressMap, setProgressMap] = useState<Record<string, PlanProgress>>({}); // 进度数据映射，key为计划ID
  const [expandedId, setExpandedId] = useState<string | null>(null); // 当前展开的计划ID

  /**
   * 加载数据
   * 并行加载计划和人员数据，然后初始化进度数据
   */
  const loadData = useCallback(async () => {
    const [plansData, personsData] = await Promise.all([
      planStorage.getAll(),
      personStorage.getAll(),
    ]);
    setPlans(plansData);
    setPersons(personsData);

    // 初始化每个计划的进度数据
    const progressRecord: Record<string, PlanProgress> = {};
    for (const plan of plansData) {
      const progress = await progressStorage.initPlanProgress(
        plan.id,
        plan.participantIds,
        plan.tasks.length
      );
      progressRecord[plan.id] = progress;
    }
    setProgressMap(progressRecord);
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * 处理任务状态变更
   * @param planId 计划ID
   * @param personId 人员ID
   * @param taskIndex 任务索引
   * @param newStatus 新状态
   */
  const handleStatusChange = async (
    planId: string,
    personId: string,
    taskIndex: number,
    newStatus: TaskProgressStatus
  ) => {
    // 更新任务状态
    const updated = await progressStorage.updateTaskStatus(
      planId,
      personId,
      taskIndex,
      newStatus
    );
    if (updated) {
      // 更新本地状态
      setProgressMap(prev => ({ ...prev, [planId]: updated }));

      // 检查并更新计划状态
      const plan = plans.find(p => p.id === planId);
      const newStatus = await checkAndUpdatePlanStatus(planId, updated, plan);
      
      if (newStatus) {
        // 只更新计划状态，不重新加载整个数据
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newStatus } : p));
      }
    }
  };



  /**
   * 切换计划的展开/折叠状态
   * @param id 计划ID
   */
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  /**
   * 循环切换任务状态
   * @param currentStatus 当前状态
   * @returns 切换后的状态
   */
  const cycleStatus = (currentStatus: TaskProgressStatus): TaskProgressStatus => {
    const statusOrder: TaskProgressStatus[] = ['pending', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return statusOrder[(currentIndex + 1) % statusOrder.length];
  };

  // 按状态分组排序：进行中 > 未开始 > 已完成
  const sortedPlans = sortPlansByStatus(plans);

  return (
    <div className="progress-viewer">
      {/* 空状态提示 */}
      {plans.length === 0 ? (
        <p className="empty-text">暂无培养计划</p>
      ) : (
        <div className="progress-list">
          {/* 遍历计划列表 */}
          {sortedPlans.map(plan => {
            const overall = getOverallProgress(progressMap, plan.id);
            const isExpanded = expandedId === plan.id;
            const canEditProgress = true; // 所有状态都可以编辑

            return (
              <div key={plan.id} className={`progress-card ${isExpanded ? 'expanded' : ''}`}>
                {/* 计划头部 */}
                <div className="progress-header" onClick={() => toggleExpand(plan.id)}>
                  <div className="progress-title-row">
                    <h2 className="progress-plan-name">{plan.name}</h2>
                    <span className="status-badge" style={getStatusBadgeStyle(plan.status)}>
                      {statusLabels[plan.status]}
                    </span>
                  </div>
                  <div className="progress-summary">
                    <div className="overall-progress">
                      <div className="overall-bar-container">
                        <div className="overall-bar" style={{ width: `${overall.percentage}%` }} />
                      </div>
                      <span className="overall-text">{overall.completed}/{overall.total}</span>
                    </div>
                    <span className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>▼</span>
                  </div>
                </div>

                {/* 计划详情 */}
                {isExpanded && (
                  <div className="progress-details">
                    <div className="progress-table">
                      <div className="progress-table-content">
                        {/* 表格头部 */}
                        <div className="table-header">
                          <div className="cell header-cell member-cell">成员</div>
                          <div className="cell header-cell stats-cell">进度</div>
                          <div className="task-columns-header">
                            {plan.tasks.map((task, index) => (
                              <div key={index} className="cell header-cell task-cell">
                                <span className="task-name">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* 表格内容 */}
                        <div className="table-body">
                          {/* 遍历参与人员 */}
                          {plan.participantIds.map(personId => {
                            const person = persons.find(p => p.id === personId);
                            const stats = getProgressStats(progressMap, plan.id, personId);
                            const memberProgress = getMemberProgress(progressMap, plan.id, personId);
                            
                            return (
                              <div key={personId} className="table-row">
                                {/* 成员信息 */}
                                <div className="cell member-cell">
                                  <div className="member-info">
                                    {person?.avatar ? (
                                      <img src={person.avatar} alt={person.name} className="member-avatar" />
                                    ) : (
                                      <div className="member-avatar-placeholder">
                                        {person?.name?.charAt(0) || '?'}
                                      </div>
                                    )}
                                    <span className="member-name">{person?.name || '未知'}</span>
                                  </div>
                                </div>
                                
                                {/* 进度信息 */}
                                <div className="cell stats-cell">
                                  <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${stats.percentage}%` }} />
                                  </div>
                                  <div className="progress-text">
                                    {stats.completed}/{stats.total} ({stats.percentage}%)
                                  </div>
                                </div>
                                
                                {/* 任务列 */}
                                <div className="task-columns-body">
                                  {memberProgress.map((mp, index) => (
                                    <div key={index} className="cell task-cell">
                                      {canEditProgress ? (
                                        <button
                                          className={`status-btn ${mp.status}`}
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleStatusChange(plan.id, personId, mp.taskIndex, cycleStatus(mp.status));
                                          }}
                                          title="点击切换状态"
                                        >
                                          {taskProgressLabels[mp.status]}
                                        </button>
                                      ) : (
                                        <span className={`status-label ${mp.status}`}>
                                          {taskProgressLabels[mp.status]}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
