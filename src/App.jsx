import React, { useState } from 'react'
import { usePortfolio } from './hooks/usePortfolio'
import { useExpenses } from './hooks/useExpenses'
import Dashboard from './components/Dashboard'
import Portfolio from './components/Portfolio'
import Expenses from './components/Expenses'

const TABS = [
  { id: 'dashboard', label: 'Vue Globale' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'expenses', label: 'Dépenses' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const portfolioHook = usePortfolio()
  const expensesHook = useExpenses()

  const loading = portfolioHook.loading || expensesHook.loading

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">FIN<span>TERM</span></div>
          <nav className="main-tabs" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`main-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main" role="tabpanel">
        {loading ? (
          <div className="empty-state">
            <span className="empty-state-icon">⟳</span>
            Chargement…
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                portfolio={portfolioHook.portfolio}
                expenses={expensesHook.expenses}
              />
            )}
            {activeTab === 'portfolio' && (
              <Portfolio {...portfolioHook} />
            )}
            {activeTab === 'expenses' && (
              <Expenses {...expensesHook} />
            )}
          </>
        )}
      </main>
    </>
  )
}
