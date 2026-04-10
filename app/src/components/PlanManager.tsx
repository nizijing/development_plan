import { useState, useEffect } from 'react';
import type { TrainingPlan, PlanStatus } from '../types/plan';
import { statusLabels, statusColors } from '../types/plan';
import type { Person } from '../types/person';
import { planStorage } from '../utils/planStorage';
import { personStorage } from '../utils/personStorage';
import './PlanManager.css';

export function PlanManager() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    tasks: string[];
    participantIds: string[];
    status: PlanStatus;
  }>({
    name: '',
    tasks: [''],
    participantIds: [],
    status: 'not_started',
  });

  useEffect(() => {
    Promise.all([planStorage.getAll(), personStorage.getAll()]).then(([plansData, personsData]) => {
      setPlans(plansData);
      setPersons(personsData);
    });
  }, []);

  const handleAddTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, ''],
    }));
  };

  const handleRemoveTask = (index: number) => {
    if (formData.tasks.length > 1) {
      setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.filter((_, i) => i !== index),
      }));
    }
  };

  const handleTaskChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => (i === index ? value : task)),
    }));
  };

  const handleParticipantToggle = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(personId)
        ? prev.participantIds.filter(id => id !== personId)
        : [...prev.participantIds, personId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('请输入计划名');
      return;
    }

    const validTasks = formData.tasks.filter(t => t.trim());
    if (validTasks.length === 0) {
      alert('请至少添加一个培养任务');
      return;
    }

    if (formData.participantIds.length === 0) {
      alert('请至少选择一个参与人员');
      return;
    }

    if (editingId) {
      await planStorage.update(editingId, {
        name: formData.name.trim(),
        tasks: validTasks,
        participantIds: formData.participantIds,
        status: formData.status,
      });
    } else {
      await planStorage.add({
        name: formData.name.trim(),
        tasks: validTasks,
        participantIds: formData.participantIds,
        status: formData.status,
      });
    }

    setPlans(await planStorage.getAll());
    resetForm();
  };

  const handleEdit = (plan: TrainingPlan) => {
    setEditingId(plan.id);
    setFormData({
      name: plan.name,
      tasks: plan.tasks.length > 0 ? plan.tasks : [''],
      participantIds: plan.participantIds,
      status: plan.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此培养计划吗？')) {
      await planStorage.delete(id);
      setPlans(await planStorage.getAll());
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      tasks: [''],
      participantIds: [],
      status: 'not_started',
    });
    setShowForm(false);
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
      <button className="add-btn" onClick={() => setShowForm(true)}>
        + 添加计划
      </button>

      {showForm && (
        <div className="form-overlay" onClick={resetForm}>
          <div className="form-modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? '编辑计划' : '添加计划'}</h2>

            <div className="form-group">
              <label>计划名</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入计划名"
              />
            </div>

            <div className="form-group">
              <label>培养任务</label>
              <div className="tasks-list">
                {formData.tasks.map((task, index) => (
                  <div key={index} className="task-item">
                    <input
                      type="text"
                      value={task}
                      onChange={e => handleTaskChange(index, e.target.value)}
                      placeholder={`任务 ${index + 1}`}
                    />
                    {formData.tasks.length > 1 && (
                      <button className="remove-task-btn" onClick={() => handleRemoveTask(index)}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button className="add-task-btn" onClick={handleAddTask}>
                  + 添加任务
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>参与人员</label>
              {persons.length === 0 ? (
                <p className="no-persons">暂无人员，请先添加人员</p>
              ) : (
                <div className="participants-list">
                  {persons.map(person => (
                    <label key={person.id} className="participant-item">
                      <input
                        type="checkbox"
                        checked={formData.participantIds.includes(person.id)}
                        onChange={() => handleParticipantToggle(person.id)}
                      />
                      <span>{person.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>状态</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as PlanStatus }))}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button className="cancel-btn" onClick={resetForm}>
                取消
              </button>
              <button className="submit-btn" onClick={handleSubmit}>
                {editingId ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="plan-list">
        {plans.length === 0 ? (
          <p className="empty-text">暂无计划，请点击上方按钮添加</p>
        ) : (
          plans.map(plan => (
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
                    <button className="edit-btn" onClick={e => { e.stopPropagation(); handleEdit(plan); }}>
                      编辑
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
