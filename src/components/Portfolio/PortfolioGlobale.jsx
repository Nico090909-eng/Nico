import React, { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  BUCKET_COLORS, BUCKET_META, BUCKET_ORDER,
  noAxesOptions, baseChartOptions, fmtEur, fmtPct,
} from '../shared/chartDefaults'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function PortfolioGlobale({ portfolio }) {
  const positions = portfolio?.positions || []

  const buckets = useMemo(() => positions.reduce((acc, p) => {
    acc[p.bucket] = (acc[p.bucket] || 0) + (p.currentValue || 0)
    return acc
  }, { equities: 0, gold: 0, crypto: 0, savings: 0 }), [positions])

  const costBuckets = useMemo(() => positions.reduce((acc, p) => {
    acc[p.bucket] = (acc[p.bucket] || 0) + (p.costBasis || 0)
    return acc
  }, { equities: 0, gold: 0, crypto: 0, savings: 0 }), [positions])

  const totalValue = Object.values(buckets).reduce((s, v) => s + v, 0)
  const totalCost  = Object.values(costBuckets).reduce((s, v) => s + v, 0)
  const totalPnl   = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const donutData = {
    labels: BUCKET_ORDER.map(k => BUCKET_META[k].label),
    datasets: [{
      data: BUCKET_ORDER.map(k => buckets[k] || 0),
      backgroundColor: BUCKET_ORDER.map(k => BUCKET_COLORS[k]),
      borderColor: '#11111e',
      borderWidth: 3,
    }],
  }

  const barData = {
    labels: BUCKET_ORDER.map(k => BUCKET_META[k].label),
    datasets: [{
      data: BUCKET_ORDER.map(k => buckets[k] || 0),
      backgroundColor: BUCKET_ORDER.map(k => BUCKET_COLORS[k]),
      borderRadius: 4,
    }],
  }

  const barOpts = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
      tooltip: { ...baseChartOptions.plugins.tooltip, callbacks: { label: ctx => fmtEur(ctx.raw) } },
    },
    scales: {
      x: { ...baseChartOptions.scales.x },
      y: { ...baseChartOptions.scales.y, ticks: { ...baseChartOptions.scales.y.ticks, callback: v => fmtEur(v) } },
    },
  }

  return (
    <div>
      {/* Header KPIs */}
      <div className="kpi-grid section">
        <div className="kpi-card">
          <div className="kpi-label">Valeur totale</div>
          <div className="kpi-value text-accent">{fmtEur(totalValue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">P&L investissements</div>
          <div className={`kpi-value ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>{fmtEur(totalPnl)}</div>
          <div className={`kpi-delta ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
            {totalPnl >= 0 ? '↑' : '↓'} {fmtPct(totalPnlPct)}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Coût total (PRU)</div>
          <div className="kpi-value">{fmtEur(totalCost)}</div>
        </div>
      </div>

      {/* Allocation bar */}
      <div className="section">
        <div className="section-title">Allocation</div>
        <div className="card" style={{ marginBottom: '0.75rem' }}>
          <div className="alloc-bar" style={{ height: 12 }}>
            {BUCKET_ORDER.map(b => (
              <div
                key={b}
                className="alloc-seg"
                style={{ flex: totalValue > 0 ? (buckets[b] || 0) / totalValue : 0, background: BUCKET_COLORS[b] }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {BUCKET_ORDER.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: BUCKET_COLORS[b] }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                  {BUCKET_META[b].label}
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{fmtEur(buckets[b] || 0)}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {totalValue > 0 ? `(${(((buckets[b] || 0) / totalValue) * 100).toFixed(1)}%)` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">Répartition</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 260 }}>
              <Doughnut
                data={donutData}
                options={{
                  ...noAxesOptions,
                  cutout: '65%',
                  plugins: {
                    ...noAxesOptions.plugins,
                    tooltip: {
                      ...noAxesOptions.plugins.tooltip,
                      callbacks: {
                        label: ctx => {
                          const pct = totalValue > 0 ? ((ctx.raw / totalValue) * 100).toFixed(1) : 0
                          return ` ${fmtEur(ctx.raw)} (${pct}%)`
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Par bucket</div>
          <div style={{ height: 220 }}>
            <Bar data={barData} options={{ ...barOpts, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Bucket cards */}
      <div className="section">
        <div className="section-title">Détail par bucket</div>
        <div className="grid-3">
          {BUCKET_ORDER.map(key => {
            const val  = buckets[key] || 0
            const cost = costBuckets[key] || 0
            const pnl  = val - cost
            const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
            const pct    = totalValue > 0 ? (val / totalValue) * 100 : 0
            const isSavings = key === 'savings'
            return (
              <div key={key} className="card" style={{ borderLeft: `3px solid ${BUCKET_COLORS[key]}` }}>
                <div className="card-title" style={{ color: BUCKET_COLORS[key] }}>
                  {BUCKET_META[key].emoji} {BUCKET_META[key].label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                  {fmtEur(val)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {pct.toFixed(1)}% du total
                </div>
                {!isSavings && (
                  <div className={`badge ${pnl >= 0 ? 'positive' : 'negative'}`}>
                    {pnl >= 0 ? '↑' : '↓'} {fmtEur(pnl)} ({fmtPct(pnlPct)})
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
