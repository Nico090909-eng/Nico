import React, { useState, useMemo } from 'react'
import {
  Chart as ChartJS, LineElement, BarElement, CategoryScale, LinearScale,
  PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { BUCKET_COLORS, baseChartOptions, fmtEur, fmtPct, monthLabel } from '../shared/chartDefaults'

ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler)

export default function Performance({ portfolio, onAddSnapshot, onDeleteSnapshot }) {
  const positions = portfolio?.positions || []
  const snapshots = portfolio?.snapshots || []

  const totalValue = positions.reduce((s, p) => s + (p.currentValue || 0), 0)
  const totalCost = positions.reduce((s, p) => s + (p.costBasis || 0), 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const bucketValues = positions.reduce((acc, p) => {
    acc[p.bucket] = (acc[p.bucket] || 0) + (p.currentValue || 0)
    return acc
  }, { equities: 0, gold: 0, crypto: 0 })

  const today = new Date().toISOString().split('T')[0].slice(0, 7)
  const [snapDate, setSnapDate] = useState(today)
  const [adding, setAdding] = useState(false)

  const momDelta = useMemo(() => {
    if (snapshots.length < 2) return null
    const last = snapshots[snapshots.length - 1]
    const prev = snapshots[snapshots.length - 2]
    const delta = last.totalValue - prev.totalValue
    const pct = prev.totalValue > 0 ? (delta / prev.totalValue) * 100 : 0
    return { delta, pct }
  }, [snapshots])

  const labels = snapshots.map(s => monthLabel(s.date))

  const lineData = {
    labels,
    datasets: [{
      label: 'Total',
      data: snapshots.map(s => s.totalValue),
      borderColor: BUCKET_COLORS.equities,
      backgroundColor: 'rgba(0,212,255,0.07)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: BUCKET_COLORS.equities,
    }],
  }

  const stackedBarData = {
    labels,
    datasets: [
      {
        label: 'Actions',
        data: snapshots.map(s => s.buckets?.equities || 0),
        backgroundColor: BUCKET_COLORS.equities,
        stack: 'portfolio',
      },
      {
        label: 'Or',
        data: snapshots.map(s => s.buckets?.gold || 0),
        backgroundColor: BUCKET_COLORS.gold,
        stack: 'portfolio',
      },
      {
        label: 'Crypto',
        data: snapshots.map(s => s.buckets?.crypto || 0),
        backgroundColor: BUCKET_COLORS.crypto,
        stack: 'portfolio',
      },
    ],
  }

  const chartOpts = {
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
        ticks: { ...baseChartOptions.scales.y.ticks, callback: v => fmtEur(v) },
      },
    },
  }

  const handleAddSnapshot = async () => {
    setAdding(true)
    await onAddSnapshot({
      date: snapDate,
      totalValue,
      buckets: { ...bucketValues },
    })
    setAdding(false)
  }

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid section">
        <div className="kpi-card">
          <div className="kpi-label">P&L total</div>
          <div className={`kpi-value ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>{fmtEur(totalPnl)}</div>
          <div className={`kpi-delta ${totalPnl >= 0 ? 'positive' : 'negative'}`}>{fmtPct(totalPnlPct)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Delta MoM</div>
          <div className={`kpi-value ${momDelta === null ? '' : momDelta.delta >= 0 ? 'text-green' : 'text-red'}`}>
            {momDelta ? fmtEur(momDelta.delta) : '—'}
          </div>
          <div className={`kpi-delta ${momDelta === null ? 'neutral' : momDelta.delta >= 0 ? 'positive' : 'negative'}`}>
            {momDelta ? fmtPct(momDelta.pct) : 'Pas assez de snapshots'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Snapshots</div>
          <div className="kpi-value text-accent">{snapshots.length}</div>
          <div className="kpi-delta neutral">enregistrements</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Valeur actuelle</div>
          <div className="kpi-value text-accent">{fmtEur(totalValue)}</div>
        </div>
      </div>

      {/* Charts */}
      {snapshots.length > 0 && (
        <div className="grid-2 section">
          <div className="card">
            <div className="card-title">Évolution portfolio</div>
            <div style={{ height: 240 }}>
              <Line data={lineData} options={{ ...chartOpts, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Par bucket (empilé)</div>
            <div style={{ height: 240 }}>
              <Bar data={stackedBarData} options={{ ...chartOpts, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      )}

      {/* Snapshot manager */}
      <div className="section">
        <div className="section-title">Snapshots</div>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date du snapshot (YYYY-MM)</label>
              <input
                type="month"
                className="form-input"
                value={snapDate}
                onChange={e => setSnapDate(e.target.value)}
                style={{ maxWidth: 200 }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingBottom: '0.1rem' }}>
              Valeur: <strong style={{ color: 'var(--accent)' }}>{fmtEur(totalValue)}</strong>
              <br />
              <span style={{ fontSize: '0.7rem' }}>Actions: {fmtEur(bucketValues.equities)} · Or: {fmtEur(bucketValues.gold)} · Crypto: {fmtEur(bucketValues.crypto)}</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAddSnapshot} disabled={adding}>
              {adding ? 'Ajout…' : '+ Ajouter snapshot'}
            </button>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📸</span>
            Aucun snapshot. Ajoutez-en un pour commencer le suivi.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Valeur totale</th>
                  <th className="num">Actions</th>
                  <th className="num">Or</th>
                  <th className="num">Crypto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map(s => (
                  <tr key={s.date}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{s.date}</td>
                    <td className="num" style={{ fontWeight: 700 }}>{fmtEur(s.totalValue)}</td>
                    <td className="num">{fmtEur(s.buckets?.equities)}</td>
                    <td className="num">{fmtEur(s.buckets?.gold)}</td>
                    <td className="num">{fmtEur(s.buckets?.crypto)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => onDeleteSnapshot(s.date)} title="Supprimer">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
