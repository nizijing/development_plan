import { useState } from 'react'
import { PersonManager } from './components/PersonManager'
import { PlanManager } from './components/PlanManager'
import { ProgressViewer } from './components/ProgressViewer'
import './App.css'

type Tab = 'persons' | 'plans' | 'progress'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('plans')

  return (
    <div className="app">
      <nav className="app-nav">
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
          进度管理
        </button>
        <button
          className={`nav-btn ${activeTab === 'persons' ? 'active' : ''}`}
          onClick={() => setActiveTab('persons')}
        >
          人员管理
        </button>
      </nav>
      <main className="app-main">
        {activeTab === 'persons' && <PersonManager />}
        {activeTab === 'plans' && <PlanManager />}
        {activeTab === 'progress' && <ProgressViewer />}
      </main>
    </div>
  )
}

export default App
