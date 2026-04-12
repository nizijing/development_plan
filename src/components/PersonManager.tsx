import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Person } from '../types/person';
import { personStorage } from '../utils/personStorage';
import './PersonManager.css';

export function PersonManager() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', avatar: '' });
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    personStorage.getAll().then(setPersons);
  }, []);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 文件大小限制：2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('图片大小不能超过 2MB');
      e.target.value = '';
      return;
    }
    
    // 文件类型检查
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      e.target.value = '';
      return;
    }
    
    try {
      // 直接读取文件为 base64，不压缩
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.onerror = () => {
        alert('图片处理失败，请重试');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    } catch {
      alert('图片处理失败，请重试');
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('请输入姓名');
      return;
    }

    if (editingId) {
      await personStorage.update(editingId, formData);
    } else {
      await personStorage.add(formData);
    }

    setPersons(await personStorage.getAll());
    resetForm();
  };

  const handleEdit = (person: Person) => {
    setEditingId(person.id);
    setFormData({ name: person.name, avatar: person.avatar });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此人员吗？')) {
      await personStorage.delete(id);
      setPersons(await personStorage.getAll());
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', avatar: '' });
    setShowForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="person-manager">
      <button className="add-btn" onClick={() => setShowForm(true)}>
        + 添加人员
      </button>

      {showForm && (
        <div className="form-overlay" onClick={resetForm}>
          <div className="form-modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? '编辑人员' : '添加人员'}</h2>

            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入姓名"
              />
            </div>

            <div className="form-group">
              <label>头像</label>
              <div className="avatar-upload">
                {formData.avatar && (
                  <img src={formData.avatar} alt="预览" className="avatar-preview" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
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

      <div className="person-list">
        {persons.length === 0 ? (
          <p className="empty-text">暂无人员，请点击上方按钮添加</p>
        ) : (
          persons.map(person => (
            <div key={person.id} className="person-card">
              <div className="person-avatar">
                {person.avatar ? (
                  <img src={person.avatar} alt={person.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="person-info">
                <span className="person-name">{person.name}</span>
              </div>
              <div className="person-actions">
                <button className="edit-btn" onClick={() => handleEdit(person)}>
                  编辑
                </button>
                <button className="delete-btn" onClick={() => handleDelete(person.id)}>
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
