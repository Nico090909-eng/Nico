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
            <span className="empty-state-icon">⟳</span>
            Chargement…
          </div>
        ) : error ? (
          <div style={{ maxWidth: 520, margin: '4rem auto', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--red)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ color: 'var(--red)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>
              ⚠ Impossible de joindre le serveur API
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              Le backend Express (port 3001) ne répond pas.<br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>Lance l'app avec :</strong><br />
              <code style={{ background: 'var(--bg-primary)', padding: '0.5rem 0.75rem', borderRadius: 4, display: 'block', margin: '0.5rem 0', color: 'var(--accent)' }}>npm run dev</code>
              (et <em>pas</em> simplement <code style={{ color: 'var(--text-primary)' }}>vite</code> ou <code style={{ color: 'var(--text-primary)' }}>npm start</code>)
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Erreur : {error}
            </div>
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
