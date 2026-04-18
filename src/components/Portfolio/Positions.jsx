import React from 'react'
import { fmtEur, fmtPct } from '../shared/chartDefaults'

const BUCKET_ORDER = ['equities', 'gold', 'crypto']
const BUCKET_LABELS = { equities: '📈 Actions', gold: '🥇 Or', crypto: '₿ Crypto' }

function TypeBadge({ type }) {
  const cls = {
    ETF: 'type-etf',
    Stock: 'type-stock',
    Crypto: 'type-crypto',
    Coin: 'type-coin',
    Stablecoin: 'type-stablecoin',
  }[type] || 'neutral'
  return <span className={`badge ${cls}`}>{type}</span>
}

function PnlCell({ value, cost }) {
  const pnl = value - cost
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : null
  const cls = pnl >= 0 ? 'text-green' : 'text-red'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
      <span className={cls} style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
        {pnl >= 0 ? '+' : ''}{fmtEur(pnl)}
      </span>
      {pnlPct !== null && (
        <span style={{ fontSize: '0.7rem', color: pnl >= 0 ? 'var(--green)' : 'var(--red)', opacity: 0.8 }}>
          {fmtPct(pnlPct)}
        </span>
      )}
    </div>
  )
}

export default function Positions({ portfolio }) {
  const positions = portfolio?.positions || []

  const grouped = BUCKET_ORDER.reduce((acc, b) => {
    acc[b] = positions.filter(p => p.bucket === b)
    return acc
  }, {})

  if (positions.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📊</span>
        Aucune position. Ajoutez-en dans l'onglet Édition.
      </div>
    )
  }

  return (
    <div>
      {BUCKET_ORDER.map(bucket => {
        const group = grouped[bucket]
        if (group.length === 0) return null
        const bucketTotal = group.reduce((s, p) => s + (p.currentValue || 0), 0)
        return (
          <div key={bucket} className="section">
            <div className="section-title">
              {BUCKET_LABELS[bucket]}
              <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {fmtEur(bucketTotal)}
              </span>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Nom</th>
                      <th>Type</th>
                      <th className="num">Valeur</th>
                      <th className="num">PRU</th>
                      <th className="num">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.ticker}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.name}</td>
                        <td><TypeBadge type={p.type} /></td>
                        <td className="num">{fmtEur(p.currentValue)}</td>
                        <td className="num" style={{ color: 'var(--text-secondary)' }}>{fmtEur(p.costBasis)}</td>
                        <td className="num">
                          <PnlCell value={p.currentValue || 0} cost={p.costBasis || 0} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
