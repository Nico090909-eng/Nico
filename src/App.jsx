import React, { useState } from 'react'
import { usePortfolio } from './hooks/usePortfolio'
import { useExpenses } from './hooks/useExpenses'
import Dashboard from './components/Dashboard'
import Portfolio from './components/Portfolio'
import Expenses from './components/Expenses'

const TABS = [
  { id: 'dashboard', label: 'Vue Globale', icon: '◈' },
  { id: 'portfolio', label: 'Portfolio',   icon: '📈' },
  { id: 'expenses',  label: 'Dépenses',    icon: '💳' },
]

export default function App() {
  const [activeTab, setActiveTab]   = useState('dashboard')
  const portfolioHook = usePortfolio()
  const expensesHook  = useExpenses()

  const loading = portfolioHook.loading || expensesHook.loading
  const error   = portfolioHook.error   || expensesHook.error

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
            <span className="empty-state-icon" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
            <br />Chargement…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{
            maxWidth: 500, margin: '4rem auto', padding: '2rem',
            background: 'var(--bg-card-solid)', border: '1px solid var(--red)',
            borderRadius: 'var(--r-lg)', boxShadow: '0 0 30px rgba(255,61,90,0.1)',
          }}>
            <div style={{ color: 'var(--red)', fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>
              ⚠ Serveur API inaccessible
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.9 }}>
              Le backend Express (port 3001) ne répond pas.<br />
              <strong style={{ color: 'var(--text-1)' }}>Lance l'app avec :</strong><br />
              <code style={{
                background: 'var(--bg-0)', padding: '0.5rem 0.875rem',
                borderRadius: 6, display: 'block', margin: '0.5rem 0',
                color: 'var(--accent)', border: '1px solid var(--border)',
              }}>npm run dev</code>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-m)' }}>
              {error}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard portfolio={portfolioHook.portfolio} expenses={expensesHook.expenses} />
            )}
            {activeTab === 'portfolio' && <Portfolio {...portfolioHook} />}
            {activeTab === 'expenses'  && <Expenses  {...expensesHook}  />}
          </>
        )}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav" role="navigation" aria-label="Navigation principale">
        <div className="mobile-nav-inner">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`mobile-nav-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
            >
              <span className="mobile-nav-icon">{tab.icon}</span>
              <span className="mobile-nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
