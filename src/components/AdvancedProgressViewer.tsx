import { useState, useEffect, useCallback } from 'react';
import type { TrainingPlan } from '../types/plan';
import { statusLabels } from '../types/plan';
import type { Person } from '../types/person';
import type { PlanProgress, TaskProgressStatus } from '../types/progress';
import { planStorage } from '../utils/planStorage';
import { personStorage } from '../utils/personStorage';
import { progressStorage } from '../utils/progressStorage';
import { checkAndUpdatePlanStatus } from '../utils/planStatusUpdater';
import { getMemberProgress, getProgressStats, getOverallProgress, getStatusBadgeStyle, sortPlansByStatus } from '../utils/progressHelpers';
import './ProgressViewer.css';

export function AdvancedProgressViewer() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, PlanProgress>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [plansData, personsData] = await Promise.all([
      planStorage.getAll(),
      personStorage.getAll(),
    ]);
    // 只显示类型为"advance"的计划
    const advancedPlans = plansData.filter(plan => (plan.type as string) === 'advance');


    setPlans(advancedPlans);
    setPersons(personsData);

    const progressRecord: Record<string, PlanProgress> = {};
    for (const plan of advancedPlans) {
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
    loadData();
  }, [loadData]);



  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 处理进阶类型计划的文本输入
  const handleHandwrittenInput = async (
    planId: string,
    personId: string,
    taskIndex: number,
    value: string
  ) => {
    // 根据输入内容判断任务状态
    const newStatus: TaskProgressStatus = value.trim() ? 'completed' : 'pending';
    const updated = await progressStorage.updateTaskStatus(
      planId,
      personId,
      taskIndex,
      newStatus,
      value
    );
    if (updated) {
      // 直接更新本地状态，不重新加载整个计划数据
      setProgressMap(prev => {
        const updatedProgress = { ...prev[planId] };
        const memberIndex = updatedProgress.memberProgress.findIndex(
          m => m.personId === personId && m.taskIndex === taskIndex
        );
        if (memberIndex !== -1) {
          updatedProgress.memberProgress[memberIndex].value = value;
          updatedProgress.memberProgress[memberIndex].status = newStatus;
        }
        return { ...prev, [planId]: updatedProgress };
      });

      const plan = plans.find(p => p.id === planId);
      const newPlanStatus = await checkAndUpdatePlanStatus(planId, updated, plan);
      
      if (newPlanStatus) {
        // 只更新计划状态，不重新加载整个数据
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newPlanStatus } : p));
      }
    }
  };

  // 按状态分组排序：进行中 > 未开始 > 已完成
  const sortedPlans = sortPlansByStatus(plans);

  return (
    <div className="progress-viewer">
      {plans.length === 0 ? (
        <p className="empty-text">暂无培养计划</p>
      ) : (
        <div className="progress-list">
          {sortedPlans.map(plan => {
            const overall = getOverallProgress(progressMap, plan.id);
            const isExpanded = expandedId === plan.id;

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
                      <div className="progress-table-content">
                        <div className="table-header">
                          <div className="fixed-columns">
                            <div className="cell header-cell member-cell">成员</div>
                            <div className="cell header-cell stats-cell">进度</div>
                          </div>
                          <div className="task-columns-header">
                            {plan.tasks.map((task, index) => (
                              <div key={index} className="cell header-cell task-cell">
                                <span className="task-name">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="table-body">
                          {plan.participantIds.map(personId => {
                            const person = persons.find(p => p.id === personId);
                            const stats = getProgressStats(progressMap, plan.id, personId);
                            const memberProgress = getMemberProgress(progressMap, plan.id, personId);
                            
                            return (
                              <div key={personId} className="table-row">
                                <div className="fixed-columns">
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
                                </div>
                                
                                <div className="task-columns-body">
                                  {memberProgress.map((mp, index) => (
                                    <div key={index} className="cell task-cell">
                                      <input
                                        type="text"
                                        className="handwritten-input"
                                        placeholder="请输入内容"
                                        value={mp.value}
                                        onChange={e => {
                                          e.stopPropagation();
                                          setProgressMap(prev => {
                                            const updatedProgress = { ...prev[plan.id] };
                                            const memberIndex = updatedProgress.memberProgress.findIndex(
                                              m => m.personId === personId && m.taskIndex === mp.taskIndex
                                            );
                                            if (memberIndex !== -1) {
                                              updatedProgress.memberProgress[memberIndex].value = e.target.value;
                                              updatedProgress.memberProgress[memberIndex].status = e.target.value.trim() ? 'completed' : 'pending';
                                            }
                                            return { ...prev, [plan.id]: updatedProgress };
                                          });
                                        }}
                                        onBlur={e => {
                                          e.stopPropagation();
                                          handleHandwrittenInput(plan.id, personId, mp.taskIndex, e.target.value);
                                        }}
                                        title="填写内容表示已完成"
                                      />
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
