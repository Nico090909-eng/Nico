import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement, LineElement, BarElement,
  CategoryScale, LinearScale, PointElement,
  Filler, Tooltip, Legend,
} from 'chart.js'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import {
  baseChartOptions, noAxesOptions,
  BUCKET_COLORS, BUCKET_META, BUCKET_ORDER, CATEGORY_COLORS, CATEGORY_EMOJIS,
  fmtEur, fmtPct, monthLabel, getLast6Months,
  getCurrentMonthKey, getLastMonthKey, getMonthKey,
} from '../shared/chartDefaults'

ChartJS.register(ArcElement, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend)

function computeBuckets(positions) {
  return positions.reduce((acc, p) => {
    acc[p.bucket] = (acc[p.bucket] || 0) + (p.currentValue || 0)
    return acc
  }, { equities: 0, gold: 0, crypto: 0, savings: 0 })
}

/* ── View toggle ─────────────────────────────────────────────────── */
const CHART_VIEWS = [
  { id: 'total',   label: 'Total' },
  { id: 'stacked', label: 'Catégories' },
  { id: 'pct',     label: '% Alloc.' },
]

function ViewToggle({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', gap: 2,
      background: 'var(--bg-primary)', borderRadius: 8, padding: 3,
      border: '1px solid var(--border)',
    }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          background: value === o.id ? 'var(--bg-card-hover)' : 'none',
          border: value === o.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
          color: value === o.id ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderRadius: 5, padding: '4px 12px',
          fontFamily: 'var(--font-heading)', fontSize: '0.65rem', fontWeight: 700,
          cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ── Custom legend row ───────────────────────────────────────────── */
function BucketLegend({ buckets, total }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem',
      marginTop: '0.875rem', paddingTop: '0.875rem',
      borderTop: '1px solid var(--border)',
    }}>
      {BUCKET_ORDER.map(b => {
        const val = buckets?.[b] || 0
        const pct = total > 0 ? (val / total * 100).toFixed(1) : '0'
        return (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: BUCKET_COLORS[b], flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {BUCKET_META[b].emoji} {BUCKET_META[b].label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: BUCKET_COLORS[b], fontWeight: 700 }}>
                {fmtEur(val)} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({pct}%)</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard({ portfolio, expenses }) {
  const positions     = portfolio?.positions || []
  const snapshots     = portfolio?.snapshots || []
  const entries       = expenses?.entries   || []
  const income        = portfolio?.income   || 0
  const [chartView, setChartView] = useState('total')

  const buckets        = useMemo(() => computeBuckets(positions), [positions])
  const totalPortfolio = Object.values(buckets).reduce((s, v) => s + v, 0)
  const currentMonth   = getCurrentMonthKey()
  const lastMonth      = getLastMonthKey()

  const monthlySpending = useMemo(() =>
    entries.reduce((acc, e) => {
      const k = getMonthKey(e.date); acc[k] = (acc[k] || 0) + e.amount; return acc
    }, {}), [entries])

  const currentSpend = monthlySpending[currentMonth] || 0
  const lastSpend    = monthlySpending[lastMonth]    || 0
  const momDelta     = currentSpend - lastSpend
  const momPct       = lastSpend > 0 ? (momDelta / lastSpend) * 100 : 0
  const netSavings   = income > 0 ? income - currentSpend : null

  const catTotals = useMemo(() =>
    entries.filter(e => getMonthKey(e.date) === currentMonth)
      .reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {}),
    [entries, currentMonth])

  const top3  = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const last6 = getLast6Months()
  const labels = snapshots.map(s => monthLabel(s.date))

  const lastSnap = snapshots.length ? snapshots[snapshots.length - 1] : null

  /* ── Chart data ── */
  const totalLineData = {
    labels,
    datasets: [{
      label: 'Patrimoine total',
      data: snapshots.map(s => s.totalValue),
      borderColor: BUCKET_COLORS.equities,
      backgroundColor: 'rgba(0,212,255,0.08)',
      fill: true, tension: 0.4, pointRadius: 4,
      pointBackgroundColor: BUCKET_COLORS.equities, pointHoverRadius: 7,
    }],
  }

  /* Stacked BAR (not area) — much more readable */
  const stackedBarData = {
    labels,
    datasets: BUCKET_ORDER.map(b => ({
      label: `${BUCKET_META[b].emoji} ${BUCKET_META[b].label}`,
      data: snapshots.map(s => s.buckets?.[b] || 0),
      backgroundColor: BUCKET_COLORS[b] + 'cc',
      hoverBackgroundColor: BUCKET_COLORS[b],
      stack: 'main',
      borderRadius: 0,
      borderSkipped: false,
    })),
  }

  /* 100% stacked BAR */
  const pctBarData = {
    labels,
    datasets: BUCKET_ORDER.map(b => ({
      label: `${BUCKET_META[b].emoji} ${BUCKET_META[b].label}`,
      data: snapshots.map(s => {
        const t = s.totalValue || 1
        return +((s.buckets?.[b] || 0) / t * 100).toFixed(1)
      }),
      backgroundColor: BUCKET_COLORS[b] + 'cc',
      hoverBackgroundColor: BUCKET_COLORS[b],
      stack: 'pct',
      borderRadius: 0,
      borderSkipped: false,
    })),
  }

  /* Spending trend */
  const spendTrendData = {
    labels: last6.map(monthLabel),
    datasets: [{
      label: 'Dépenses',
      data: last6.map(k => monthlySpending[k] || 0),
      borderColor: '#ff3d5a', backgroundColor: 'rgba(255,61,90,0.08)',
      fill: true, tension: 0.4, pointRadius: 4,
      pointBackgroundColor: '#ff3d5a', pointHoverRadius: 7,
    }],
  }

  const top3BarData = {
    labels: top3.map(([cat]) => `${CATEGORY_EMOJIS[cat] || ''} ${cat}`),
    datasets: [{
      data: top3.map(([, v]) => v),
      backgroundColor: top3.map((_, i) => CATEGORY_COLORS[i]),
      borderRadius: 5, barThickness: 28,
    }],
  }

  /* ── Shared chart opts ── */
  const noLegend   = { display: false }
  const eurTooltip = { ...baseChartOptions.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtEur(ctx.raw)}` } }
  const pctTooltip = { ...baseChartOptions.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}%` } }

  const lineOpts = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: noLegend, tooltip: eurTooltip },
    scales: {
      x: { ...baseChartOptions.scales.x },
      y: { ...baseChartOptions.scales.y, ticks: { ...baseChartOptions.scales.y.ticks, callback: v => fmtEur(v) } },
    },
  }

  const stackedOpts = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: noLegend, tooltip: eurTooltip },
    scales: {
      x: { ...baseChartOptions.scales.x, stacked: true },
      y: { ...baseChartOptions.scales.y, stacked: true, ticks: { ...baseChartOptions.scales.y.ticks, callback: v => fmtEur(v) } },
    },
  }

  const pctOpts = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: noLegend, tooltip: pctTooltip },
    scales: {
      x: { ...baseChartOptions.scales.x, stacked: true },
      y: {
        ...baseChartOptions.scales.y, stacked: true,
        min: 0, max: 100,
        ticks: { ...baseChartOptions.scales.y.ticks, callback: v => `${v}%` },
      },
    },
  }

  const spendLineOpts = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: noLegend, tooltip: eurTooltip },
    scales: {
      x: { ...baseChartOptions.scales.x },
      y: { ...baseChartOptions.scales.y, ticks: { ...baseChartOptions.scales.y.ticks, callback: v => fmtEur(v) } },
    },
  }

  const barOpts = {
    ...baseChartOptions,
    indexAxis: 'y',
    plugins: {
      ...baseChartOptions.plugins, legend: noLegend,
      tooltip: { ...baseChartOptions.plugins.tooltip, callbacks: { label: ctx => ` ${fmtEur(ctx.raw)}` } },
    },
    scales: {
      x: { ...baseChartOptions.scales.x, ticks: { ...baseChartOptions.scales.x.ticks, callback: v => fmtEur(v) } },
      y: { ...baseChartOptions.scales.y },
    },
  }

  const noData = snapshots.length === 0

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid section">
        <div className="kpi-card">
          <div className="kpi-label">Patrimoine total</div>
          <div className="kpi-value text-accent">{fmtEur(totalPortfolio)}</div>
          <div className="kpi-delta neutral">Invests + épargne</div>
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
            <div className={`kpi-value ${netSavings >= 0 ? 'text-green' : 'text-red'}`}>{fmtEur(netSavings)}</div>
            <div className="kpi-delta neutral">Salaire {fmtEur(income)}</div>
          </div>
        )}
        {BUCKET_ORDER.map(b => (
          <div key={b} className="kpi-card">
            <div className="kpi-label">{BUCKET_META[b].emoji} {BUCKET_META[b].label}</div>
            <div className="kpi-value" style={{ color: BUCKET_COLORS[b] }}>{fmtEur(buckets[b] || 0)}</div>
            <div className="kpi-delta neutral">
              {totalPortfolio > 0 ? ((buckets[b] || 0) / totalPortfolio * 100).toFixed(1) : '0'}%
            </div>
          </div>
        ))}
      </div>

      {/* ── Évolution patrimoine ── */}
      <div className="card section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Évolution patrimoine</div>
          <ViewToggle options={CHART_VIEWS} value={chartView} onChange={setChartView} />
        </div>

        {noData ? (
          <div className="empty-state" style={{ padding: '2.5rem' }}>
            <span className="empty-state-icon">📈</span>
            Ajoutez des snapshots dans Portfolio → Performance
          </div>
        ) : (
          <>
            <div style={{ height: 300 }}>
              {chartView === 'total'   && <Line data={totalLineData} options={{ ...lineOpts,    maintainAspectRatio: false }} />}
              {chartView === 'stacked' && <Bar  data={stackedBarData} options={{ ...stackedOpts, maintainAspectRatio: false }} />}
              {chartView === 'pct'     && <Bar  data={pctBarData}     options={{ ...pctOpts,     maintainAspectRatio: false }} />}
            </div>

            {/* Custom legend — always visible, no overlap */}
            {(chartView === 'stacked' || chartView === 'pct') && (
              <BucketLegend buckets={lastSnap?.buckets} total={lastSnap?.totalValue} />
            )}

            {chartView === 'total' && (
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Dernier snapshot :
                  <strong style={{ color: 'var(--accent)', marginLeft: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {lastSnap ? fmtEur(lastSnap.totalValue) : '—'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {snapshots.length} points · {snapshots[0]?.date} → {snapshots[snapshots.length - 1]?.date}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Allocation donut + spending */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">Allocation actuelle</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 240 }}>
              <Doughnut data={{
                labels: BUCKET_ORDER.map(k => BUCKET_META[k].label),
                datasets: [{
                  data: BUCKET_ORDER.map(k => buckets[k] || 0),
                  backgroundColor: BUCKET_ORDER.map(k => BUCKET_COLORS[k]),
                  borderColor: 'var(--bg-card)', borderWidth: 3,
                }],
              }} options={{
                ...noAxesOptions, cutout: '66%',
                plugins: {
                  ...noAxesOptions.plugins,
                  tooltip: { ...noAxesOptions.plugins.tooltip, callbacks: { label: ctx => ` ${fmtEur(ctx.raw)} · ${totalPortfolio > 0 ? ((ctx.raw / totalPortfolio) * 100).toFixed(1) : 0}%` } },
                },
              }} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Tendance dépenses (6 mois)</div>
          <div style={{ height: 220 }}>
            <Line data={spendTrendData} options={{ ...spendLineOpts, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {top3.length > 0 && (
        <div className="card section">
          <div className="card-title">Top catégories ce mois</div>
          <div style={{ height: 160 }}>
            <Bar data={top3BarData} options={{ ...barOpts, maintainAspectRatio: false }} />
          </div>
        </div>
      )}
    </div>
  )
}
