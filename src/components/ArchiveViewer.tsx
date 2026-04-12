import { useState, useEffect } from 'react';
import type { TrainingPlan, PlanStatus } from '../types/plan';
import { statusLabels, statusColors } from '../types/plan';
import type { Person } from '../types/person';
import { archiveStorage } from '../utils/archiveStorage';
import { planStorage } from '../utils/planStorage';
import { personStorage } from '../utils/personStorage';
import './PlanManager.css';

export function ArchiveViewer() {
  const [archivedPlans, setArchivedPlans] = useState<TrainingPlan[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [plansData, personsData] = await Promise.all([
      archiveStorage.getAll(),
      personStorage.getAll()
    ]);
    setArchivedPlans(plansData);
    setPersons(personsData);
  };

  const handleRestore = async (plan: TrainingPlan) => {
    if (confirm('确定要恢复此培养计划吗？')) {
      const restored = await archiveStorage.restore(plan.id);
      if (restored) {
        await planStorage.restoreFromArchive(restored);
        await loadData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此归档的培养计划吗？')) {
      await archiveStorage.delete(id);
      await loadData();
    }
  };

  const getStatusBadgeStyle = (status: PlanStatus) => ({
    backgroundColor: statusColors[status],
    color: 'white',
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="plan-manager">
      <h1>归档的培养计划</h1>

      <div className="plan-list">
        {archivedPlans.length === 0 ? (
          <p className="empty-text">暂无归档的计划</p>
        ) : (
          archivedPlans.map(plan => (
            <div key={plan.id} className={`plan-card ${expandedId === plan.id ? 'expanded' : ''}`}>
              <div className="plan-header" onClick={() => toggleExpand(plan.id)}>
                <div className="plan-title-row">
                  <h2 className="plan-name">{plan.name}</h2>
                  <span className="status-badge" style={getStatusBadgeStyle(plan.status)}>
                    {statusLabels[plan.status]}
                  </span>
                </div>
                <div className="plan-summary">
                  <span className="summary-item">
                    <span className="summary-label">任务</span>
                    <span className="summary-value">{plan.tasks.length}</span>
                  </span>
                  <span className="summary-item">
                    <span className="summary-label">成员</span>
                    <span className="summary-value">{plan.participantIds.length}</span>
                  </span>
                  <span className={`expand-icon ${expandedId === plan.id ? 'rotated' : ''}`}>▼</span>
                </div>
              </div>

              {expandedId === plan.id && (
                <div className="plan-details">
                  <div className="plan-row">
                    <div className="plan-row-label">培养任务</div>
                    <div className="plan-row-content">
                      {plan.tasks.map((task, index) => (
                        <span key={index} className="task-tag">{task}</span>
                      ))}
                    </div>
                  </div>

                  <div className="plan-row">
                    <div className="plan-row-label">参与人员</div>
                    <div className="plan-row-content">
                      {plan.participantIds.map(id => {
                        const person = persons.find(p => p.id === id);
                        return (
                          <div key={id} className="participant-badge">
                            {person?.avatar ? (
                              <img src={person.avatar} alt={person.name} />
                            ) : (
                              <span className="avatar-placeholder-small">
                                {person?.name?.charAt(0) || '?'}
                              </span>
                            )}
                            <span>{person?.name || '未知'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="plan-actions-bar">
                    <button className="edit-btn" onClick={e => { e.stopPropagation(); handleRestore(plan); }}>
                      恢复
                    </button>
                    <button className="delete-btn" onClick={e => { e.stopPropagation(); handleDelete(plan.id); }}>
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
