import { useState } from 'react';
import { PlanManager } from './components/PlanManager';
import { ArchiveViewer } from './components/ArchiveViewer';
import { PersonManager } from './components/PersonManager';
import { ProgressViewer } from './components/ProgressViewer';
import { AdvancedProgressViewer } from './components/AdvancedProgressViewer';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'persons' | 'plans' | 'progress' | 'advanced' | 'archive'>('persons');

  return (
    <div className="app">
      <header className="app-header">
        <h1>培养计划管理</h1>
        <nav className="app-nav">
          <button 
            className={`nav-btn ${activeTab === 'persons' ? 'active' : ''}`}
            onClick={() => setActiveTab('persons')}
          >
            人员管理
          </button>
          <button 
            className={`nav-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            培养计划
          </button>
          <button 
            className={`nav-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            普通进度
          </button>
          <button 
            className={`nav-btn ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            进阶进度
          </button>
          <button 
            className={`nav-btn ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            归档计划
          </button>
        </nav>
      </header>
      <main className="app-main">
        {activeTab === 'persons' && <PersonManager />}
        {activeTab === 'plans' && <PlanManager />}
        {activeTab === 'progress' && <ProgressViewer />}
        {activeTab === 'advanced' && <AdvancedProgressViewer />}
        {activeTab === 'archive' && <ArchiveViewer />}
      </main>
    </div>
  );
}
