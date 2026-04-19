import React, { useState, useMemo, useCallback } from 'react'
import {
  Chart as ChartJS, ArcElement, LineElement, BarElement, CategoryScale, LinearScale,
  PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import {
  baseChartOptions, CATEGORY_COLORS, CATEGORY_EMOJIS, CATEGORIES,
  fmtEur, fmtPct, monthLabel, getLast6Months, getCurrentMonthKey, getMonthKey,
} from '../shared/chartDefaults'

ChartJS.register(ArcElement, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler)

const SUB_TABS = [
  { id: 'summary', label: 'Résumé' },
  { id: 'charts', label: 'Graphiques' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'list', label: 'Liste' },
]

function useMonthFilter(entries) {
  const currentMonth = getCurrentMonthKey()
  const [month, setMonth] = useState(currentMonth)
  const available = useMemo(() => {
    const keys = [...new Set(entries.map(e => getMonthKey(e.date)))].sort().reverse()
    if (!keys.includes(currentMonth)) keys.unshift(currentMonth)
    return keys
  }, [entries, currentMonth])
  const filtered = useMemo(() => entries.filter(e => getMonthKey(e.date) === month), [entries, month])
  return { month, setMonth, available, filtered }
}

function AddExpenseModal({ onClose, onAdd }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ amount: '', date: today, category: CATEGORIES[0], note: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
    setLoading(true)
    await onAdd({ ...form, amount: Number(form.amount) })
    setLoading(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nouvelle dépense</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Montant (€)</label>
            <input
              type="number"
              className="form-input"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0"
              min="0.01"
              step="0.01"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optionnel)</label>
            <input type="text" className="form-input" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Description…" maxLength={200} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Summary({ entries, allEntries }) {
  const currentMonth = getCurrentMonthKey()
  const lastMonth = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const currentTotal = entries.reduce((s, e) => s + e.amount, 0)
  const lastEntries = allEntries.filter(e => getMonthKey(e.date) === lastMonth)
  const lastTotal = lastEntries.reduce((s, e) => s + e.amount, 0)
  const momDelta = currentTotal - lastTotal
  const momPct = lastTotal > 0 ? (momDelta / lastTotal) * 100 : 0

  const catTotals = useMemo(() => {
    return entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})
  }, [entries])

  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <div className="kpi-grid section">
        <div className="kpi-card">
          <div className="kpi-label">Total ce mois</div>
          <div className="kpi-value">{fmtEur(currentTotal)}</div>
          <div className={`kpi-delta ${momDelta <= 0 ? 'positive' : 'negative'}`}>
            {momDelta <= 0 ? '↓' : '↑'} {fmtEur(Math.abs(momDelta))} vs mois dernier ({fmtPct(momPct)})
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Transactions</div>
          <div className="kpi-value text-accent">{entries.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Moy. par transaction</div>
          <div className="kpi-value">{entries.length > 0 ? fmtEur(currentTotal / entries.length) : '—'}</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Par catégorie</div>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">💳</span>
            Aucune dépense ce mois
          </div>
        ) : (
          <div className="grid-3">
            {sorted.map(([cat, val], i) => (
              <div key={cat} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>
                    {CATEGORY_EMOJIS[cat]} <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.82rem' }}>{cat}</span>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {currentTotal > 0 ? ((val / currentTotal) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '0.4rem', color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
                  {fmtEur(val)}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill ok"
                    style={{
                      width: `${currentTotal > 0 ? (val / currentTotal) * 100 : 0}%`,
                      background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Charts({ entries }) {
  const last6 = getLast6Months()
  const currentMonth = getCurrentMonthKey()

  const currentEntries = useMemo(() => entries.filter(e => getMonthKey(e.date) === currentMonth), [entries, currentMonth])

  const catTotals = useMemo(() => {
    return currentEntries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})
  }, [currentEntries])

  const catSorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1])

  const barData = {
    labels: catSorted.map(([c]) => `${CATEGORY_EMOJIS[c]} ${c}`),
    datasets: [{
      label: 'Dépenses',
      data: catSorted.map(([, v]) => v),
      backgroundColor: catSorted.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
      borderRadius: 4,
    }],
  }

  const monthlyTotals = useMemo(() => {
    return entries.reduce((acc, e) => {
      const k = getMonthKey(e.date)
      acc[k] = (acc[k] || 0) + e.amount
      return acc
    }, {})
  }, [entries])

  const lineData = {
    labels: last6.map(monthLabel),
    datasets: [{
      label: 'Total mensuel',
      data: last6.map(k => monthlyTotals[k] || 0),
      borderColor: '#ff4466',
      backgroundColor: 'rgba(255,68,102,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#ff4466',
    }],
  }

  const stackedDatasets = CATEGORIES.map((cat, i) => ({
    label: `${CATEGORY_EMOJIS[cat]} ${cat}`,
    data: last6.map(k => {
      return entries.filter(e => getMonthKey(e.date) === k && e.category === cat).reduce((s, e) => s + e.amount, 0)
    }),
    backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] + 'cc',
    fill: true,
    stack: 'stack',
    tension: 0.3,
  }))

  const stackedAreaData = {
    labels: last6.map(monthLabel),
    datasets: stackedDatasets,
  }

  const moneyOpts = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtEur(ctx.raw)}` },
      },
    },
    scales: {
      x: { ...baseChartOptions.scales.x },
      y: {
        ...baseChartOptions.scales.y,
        stacked: false,
        ticks: { ...baseChartOptions.scales.y.ticks, callback: v => fmtEur(v) },
      },
    },
  }

  const stackedOpts = {
    ...moneyOpts,
    scales: {
      x: { ...baseChartOptions.scales.x, stacked: true },
      y: { ...moneyOpts.scales.y, stacked: true },
    },
  }

  return (
    <div>
      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">Par catégorie (ce mois)</div>
          <div style={{ height: 280 }}>
            {catSorted.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>Aucune dépense ce mois</div>
            ) : (
              <Bar data={barData} options={{ ...moneyOpts, indexAxis: 'y', maintainAspectRatio: false }} />
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Tendance mensuelle (6 mois)</div>
          <div style={{ height: 280 }}>
            <Line data={lineData} options={{ ...moneyOpts, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
      <div className="card section">
        <div className="card-title">Répartition par catégorie (6 mois)</div>
        <div style={{ height: 300 }}>
          <Bar data={stackedAreaData} options={{ ...stackedOpts, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  )
}

function Budgets({ expenses, onUpdateBudgets }) {
  const entries = expenses?.entries || []
  const budgets = expenses?.budgets || {}
  const currentMonth = getCurrentMonthKey()

  const [localBudgets, setLocalBudgets] = useState(() => ({ ...budgets }))
  const [saving, setSaving] = useState(false)

  const catTotals = useMemo(() => {
    return entries
      .filter(e => getMonthKey(e.date) === currentMonth)
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount
        return acc
      }, {})
  }, [entries, currentMonth])

  const handleSave = async () => {
    setSaving(true)
    await onUpdateBudgets(localBudgets)
    setSaving(false)
  }

  return (
    <div>
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Limites budgétaires (ce mois)</div>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </div>
        <div className="grid-2">
          {CATEGORIES.map((cat, i) => {
            const spent = catTotals[cat] || 0
            const budget = Number(localBudgets[cat]) || 0
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
            const over = budget > 0 && spent > budget
            const fillClass = over ? 'over' : pct > 75 ? 'warn' : 'ok'
            return (
              <div key={cat} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {CATEGORY_EMOJIS[cat]} {cat}
                  </span>
                  {over && <span className="badge negative">DÉPASSÉ</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: over ? 'var(--red)' : CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
                    {fmtEur(spent)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ maxWidth: 100, padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    value={localBudgets[cat] || ''}
                    onChange={e => setLocalBudgets(b => ({ ...b, [cat]: e.target.value }))}
                    placeholder="Budget"
                    min="0"
                    step="10"
                  />
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${fillClass}`}
                    style={{ width: `${budget > 0 ? pct : 0}%` }}
                  />
                </div>
                {budget > 0 && (
                  <div style={{ fontSize: '0.7rem', color: over ? 'var(--red)' : 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                    {over ? `Dépassement de ${fmtEur(spent - budget)}` : `${pct.toFixed(0)}% utilisé — reste ${fmtEur(budget - spent)}`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExpenseList({ entries, onDelete }) {
  const [catFilter, setCatFilter] = useState('')
  const { month, setMonth, available, filtered } = useMonthFilter(entries)

  const displayed = catFilter ? filtered.filter(e => e.category === catFilter) : filtered
  const sorted = [...displayed].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="filter-row">
        <div className="form-group" style={{ flex: '0 0 auto' }}>
          <select className="form-select" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 'auto' }}>
            {available.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: '0 0 auto' }}>
          <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
          </select>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'flex-end', paddingBottom: '0.5rem' }}>
          {sorted.length} dépense{sorted.length > 1 ? 's' : ''} · {fmtEur(sorted.reduce((s, e) => s + e.amount, 0))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📋</span>
          Aucune dépense pour cette période
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Catégorie</th>
                <th className="num">Montant</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(e => (
                <tr key={e.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{e.date}</td>
                  <td>
                    <span>{CATEGORY_EMOJIS[e.category]} </span>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{e.category}</span>
                  </td>
                  <td className="num" style={{ fontWeight: 700, color: 'var(--red)' }}>−{fmtEur(e.amount)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', maxWidth: 200 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {e.note || '—'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => onDelete(e.id)} title="Supprimer">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Expenses({ expenses, addEntry, deleteEntry, updateBudgets }) {
  const [sub, setSub] = useState('summary')
  const [showModal, setShowModal] = useState(false)

  const entries = expenses?.entries || []
  const currentMonth = getCurrentMonthKey()
  const currentEntries = useMemo(() => entries.filter(e => getMonthKey(e.date) === currentMonth), [entries, currentMonth])

  return (
    <div>
      {/* Header row: sub-tabs + desktop add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0' }}>
        <div className="sub-tabs" style={{ flex: 1, marginBottom: 0, borderBottom: 'none' }}>
          {SUB_TABS.map(t => (
            <button
              key={t.id}
              className={`sub-tab${sub === t.id ? ' active' : ''}`}
              onClick={() => setSub(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Desktop add button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowModal(true)}
          style={{ flexShrink: 0 }}
        >
          + Dépense
        </button>
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }} />

      {sub === 'summary' && <Summary entries={currentEntries} allEntries={entries} />}
      {sub === 'charts'  && <Charts entries={entries} />}
      {sub === 'budgets' && <Budgets expenses={expenses} onUpdateBudgets={updateBudgets} />}
      {sub === 'list'    && <ExpenseList entries={entries} onDelete={deleteEntry} />}

      {/* Mobile FAB — always visible on phone */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 'calc(var(--mobile-nav-h) + env(safe-area-inset-bottom, 0px) + 14px)',
          right: '16px',
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#00d4ff,#7c4dff)',
          color: '#fff', border: 'none',
          fontSize: '1.6rem', fontWeight: 300, lineHeight: 1,
          boxShadow: '0 4px 20px rgba(0,212,255,0.45)',
          cursor: 'pointer', zIndex: 150,
          alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
        className="expense-fab"
        aria-label="Ajouter une dépense"
      >
        +
      </button>

      <style>{`
        @media (max-width: 768px) {
          .expense-fab { display: flex !important; }
        }
      `}</style>

      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onAdd={addEntry}
        />
      )}
    </div>
  )
}
