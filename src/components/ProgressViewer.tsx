import { useState, useEffect, useCallback } from 'react';
import type { TrainingPlan, PlanStatus } from '../types/plan';
import { statusLabels, statusColors } from '../types/plan';
import type { Person } from '../types/person';
import type { PlanProgress, MemberTaskProgress, TaskProgressStatus } from '../types/progress';
import { taskProgressLabels } from '../types/progress';
import { planStorage } from '../utils/planStorage';
import { personStorage } from '../utils/personStorage';
import { progressStorage } from '../utils/progressStorage';
import './ProgressViewer.css';

export function ProgressViewer() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, PlanProgress>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [plansData, personsData] = await Promise.all([
      planStorage.getAll(),
      personStorage.getAll(),
    ]);
    setPlans(plansData);
    setPersons(personsData);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleStatusChange = async (
    planId: string,
    personId: string,
    taskIndex: number,
    newStatus: TaskProgressStatus
  ) => {
    const updated = await progressStorage.updateTaskStatus(
      planId,
      personId,
      taskIndex,
      newStatus
    );
    if (updated) {
      setProgressMap(prev => ({ ...prev, [planId]: updated }));

      const allCompleted = updated.memberProgress.every(mp => mp.status === 'completed');

      if (allCompleted) {
        await planStorage.update(planId, { status: 'completed' });
        loadData();
      } else {
        const plan = plans.find(p => p.id === planId);
        if (plan?.status === 'completed') {
          await planStorage.update(planId, { status: 'in_progress' });
          loadData();
        }
      }
    }
  };

  const getMemberProgress = (planId: string, personId: string): MemberTaskProgress[] => {
    const progress = progressMap[planId];
    if (!progress) return [];
    return progress.memberProgress.filter(m => m.personId === personId);
  };

  const getProgressStats = (planId: string, personId: string) => {
    const memberProgress = getMemberProgress(planId, personId);
    const total = memberProgress.length;
    const completed = memberProgress.filter(m => m.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const getOverallProgress = (planId: string) => {
    const progress = progressMap[planId];
    if (!progress) return { total: 0, completed: 0, percentage: 0 };
    const total = progress.memberProgress.length;
    const completed = progress.memberProgress.filter(m => m.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const getStatusBadgeStyle = (status: PlanStatus) => ({
    backgroundColor: statusColors[status],
    color: 'white',
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const cycleStatus = (currentStatus: TaskProgressStatus): TaskProgressStatus => {
    const statusOrder: TaskProgressStatus[] = ['pending', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return statusOrder[(currentIndex + 1) % statusOrder.length];
  };

  // 按状态分组排序：进行中 > 未开始 > 已完成
  const sortedPlans = [...plans].sort((a, b) => {
    const order: PlanStatus[] = ['in_progress', 'not_started', 'completed'];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <div className="progress-viewer">
      {plans.length === 0 ? (
        <p className="empty-text">暂无培养计划</p>
      ) : (
        <div className="progress-list">
          {sortedPlans.map(plan => {
            const overall = getOverallProgress(plan.id);
            const isExpanded = expandedId === plan.id;
            const canEditProgress = true; // 所有状态都可以编辑

            return (
              <div key={plan.id} className={`progress-card ${isExpanded ? 'expanded' : ''}`}>
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

                {isExpanded && (
                  <div className="progress-details">
                    <div className="progress-table">
                      <div className="table-header">
                        <div className="cell header-cell member-cell">成员</div>
                        <div className="cell header-cell stats-cell">进度</div>
                        {plan.tasks.map((task, index) => (
                          <div key={index} className="cell header-cell task-cell">
                            <span className="task-name">{task}</span>
                          </div>
                        ))}
                      </div>

                      <div className="table-body">
                        {plan.participantIds.map(personId => {
                          const person = persons.find(p => p.id === personId);
                          const stats = getProgressStats(plan.id, personId);
                          const memberProgress = getMemberProgress(plan.id, personId);

                          return (
                            <div key={personId} className="table-row">
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

                              <div className="cell stats-cell">
                                <div className="progress-bar-container">
                                  <div className="progress-bar" style={{ width: `${stats.percentage}%` }} />
                                </div>
                                <div className="progress-text">
                                  {stats.completed}/{stats.total} ({stats.percentage}%)
                                </div>
                              </div>

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
                          );
                        })}
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
