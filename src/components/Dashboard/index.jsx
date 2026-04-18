import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  ArcElement, LineElement, BarElement,
  CategoryScale, LinearScale, PointElement,
  Filler, Tooltip, Legend,
} from 'chart.js'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import {
  baseChartOptions, noAxesOptions, BUCKET_COLORS, CATEGORY_COLORS, CATEGORY_EMOJIS,
  fmtEur, fmtPct, monthLabel, getLast6Months, getCurrentMonthKey, getLastMonthKey, getMonthKey,
} from '../shared/chartDefaults'

ChartJS.register(ArcElement, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend)

function computeBucketTotals(positions) {
  return positions.reduce((acc, p) => {
    acc[p.bucket] = (acc[p.bucket] || 0) + (p.currentValue || 0)
    return acc
  }, { equities: 0, gold: 0, crypto: 0 })
}

function computeMonthlySpending(entries) {
  return entries.reduce((acc, e) => {
    const key = getMonthKey(e.date)
    acc[key] = (acc[key] || 0) + e.amount
    return acc
  }, {})
}

function computeCategoryTotals(entries, monthKey) {
  return entries
    .filter(e => getMonthKey(e.date) === monthKey)
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})
}

export default function Dashboard({ portfolio, expenses }) {
  const positions = portfolio?.positions || []
  const snapshots = portfolio?.snapshots || []
  const entries = expenses?.entries || []
  const income = portfolio?.income || 0

  const buckets = useMemo(() => computeBucketTotals(positions), [positions])
  const totalPortfolio = Object.values(buckets).reduce((s, v) => s + v, 0)

  const currentMonth = getCurrentMonthKey()
  const lastMonth = getLastMonthKey()
  const monthlySpending = useMemo(() => computeMonthlySpending(entries), [entries])
  const currentSpend = monthlySpending[currentMonth] || 0
  const lastSpend = monthlySpending[lastMonth] || 0
  const momDelta = currentSpend - lastSpend
  const momPct = lastSpend > 0 ? (momDelta / lastSpend) * 100 : 0
  const netSavings = income > 0 ? income - currentSpend : null

  const catTotals = useMemo(() => computeCategoryTotals(entries, currentMonth), [entries, currentMonth])
  const top3 = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const last6 = getLast6Months()

  // Allocation donut
  const donutData = {
    labels: ['Actions', 'Or', 'Crypto'],
    datasets: [{
      data: [buckets.equities, buckets.gold, buckets.crypto],
      backgroundColor: [BUCKET_COLORS.equities, BUCKET_COLORS.gold, BUCKET_COLORS.crypto],
      borderColor: '#11111e',
      borderWidth: 3,
    }],
  }

  // Portfolio evolution line
  const snapshotLabels = snapshots.map(s => monthLabel(s.date))
  const snapshotValues = snapshots.map(s => s.totalValue)
  const portfolioLineData = {
    labels: snapshotLabels.length ? snapshotLabels : ['—'],
    datasets: [{
      label: 'Portfolio',
      data: snapshotValues.length ? snapshotValues : [0],
      borderColor: BUCKET_COLORS.equities,
      backgroundColor: 'rgba(0,212,255,0.07)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: BUCKET_COLORS.equities,
    }],
  }

  // Monthly spending trend
  const spendTrendData = {
    labels: last6.map(monthLabel),
    datasets: [{
      label: 'Dépenses',
      data: last6.map(k => monthlySpending[k] || 0),
      borderColor: '#ff4466',
      backgroundColor: 'rgba(255,68,102,0.07)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#ff4466',
    }],
  }

  // Top 3 categories mini bar
  const top3BarData = {
    labels: top3.map(([cat]) => `${CATEGORY_EMOJIS[cat] || ''} ${cat}`),
    datasets: [{
      label: 'Dépenses',
      data: top3.map(([, v]) => v),
      backgroundColor: [CATEGORY_COLORS[0], CATEGORY_COLORS[1], CATEGORY_COLORS[2]],
      borderRadius: 4,
    }],
  }

  const lineOpts = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: { label: ctx => fmtEur(ctx.raw) },
      },
    },
    scales: {
      x: { ...baseChartOptions.scales.x },
      y: {
        ...baseChartOptions.scales.y,
        ticks: {
          ...baseChartOptions.scales.y.ticks,
          callback: v => fmtEur(v),
        },
      },
    },
  }

  const barOpts = {
    ...baseChartOptions,
    indexAxis: 'y',
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: { label: ctx => fmtEur(ctx.raw) },
      },
    },
    scales: {
      x: {
        ...baseChartOptions.scales.x,
        ticks: { ...baseChartOptions.scales.x.ticks, callback: v => fmtEur(v) },
      },
      y: { ...baseChartOptions.scales.y },
    },
  }

  return (
    <div>
      {/* KPI Row */}
      <div className="kpi-grid section">
        <div className="kpi-card">
          <div className="kpi-label">Valeur nette</div>
          <div className="kpi-value text-accent">{fmtEur(totalPortfolio)}</div>
          <div className="kpi-delta neutral">Portfolio total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Dépenses ce mois</div>
          <div className="kpi-value">{fmtEur(currentSpend)}</div>
          <div className={`kpi-delta ${momDelta <= 0 ? 'positive' : 'negative'}`}>
            {momDelta <= 0 ? '↓' : '↑'} {fmtEur(Math.abs(momDelta))} vs mois dernier ({fmtPct(momPct)})
          </div>
        </div>
        {netSavings !== null && (
          <div className="kpi-card">
            <div className="kpi-label">Épargne nette</div>
            <div className={`kpi-value ${netSavings >= 0 ? 'text-green' : 'text-red'}`}>
              {fmtEur(netSavings)}
            </div>
            <div className="kpi-delta neutral">Ce mois</div>
          </div>
        )}
        <div className="kpi-card">
          <div className="kpi-label">Actions</div>
          <div className="kpi-value text-accent">{fmtEur(buckets.equities)}</div>
          <div className="kpi-delta neutral">
            {totalPortfolio > 0 ? fmtPct(buckets.equities / totalPortfolio * 100).replace('+', '') : '—'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Or</div>
          <div className="kpi-value text-gold">{fmtEur(buckets.gold)}</div>
          <div className="kpi-delta neutral">
            {totalPortfolio > 0 ? fmtPct(buckets.gold / totalPortfolio * 100).replace('+', '') : '—'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Crypto</div>
          <div className="kpi-value" style={{ color: 'var(--purple)' }}>{fmtEur(buckets.crypto)}</div>
          <div className="kpi-delta neutral">
            {totalPortfolio > 0 ? fmtPct(buckets.crypto / totalPortfolio * 100).replace('+', '') : '—'}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">Allocation</div>
          <div className="chart-wrap" style={{ maxHeight: 260, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 280 }}>
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
                          const v = ctx.raw
                          const pct = totalPortfolio > 0 ? ((v / totalPortfolio) * 100).toFixed(1) : 0
                          return ` ${fmtEur(v)} (${pct}%)`
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
          <div className="card-title">Évolution du portfolio</div>
          <div className="chart-wrap" style={{ height: 240 }}>
            {snapshots.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="empty-state-icon">📈</span>
                Ajoutez des snapshots dans l'onglet Portfolio
              </div>
            ) : (
              <Line data={portfolioLineData} options={{ ...lineOpts, maintainAspectRatio: false }} />
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">Tendance dépenses (6 mois)</div>
          <div className="chart-wrap" style={{ height: 220 }}>
            <Line data={spendTrendData} options={{ ...lineOpts, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">Top 3 catégories ce mois</div>
          <div className="chart-wrap" style={{ height: 220 }}>
            {top3.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <span className="empty-state-icon">🍽️</span>
                Aucune dépense ce mois
              </div>
            ) : (
              <Bar data={top3BarData} options={{ ...barOpts, maintainAspectRatio: false }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
