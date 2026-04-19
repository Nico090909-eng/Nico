import React, { useEffect, useRef } from 'react'
import { BUCKET_ORDER, BUCKET_META, BUCKET_COLORS, fmtEur, fmtPct } from '../shared/chartDefaults'

function TypeBadge({ type }) {
  const cls = {
    ETF: 'type-etf', Stock: 'type-stock', Crypto: 'type-crypto',
    Coin: 'type-coin', Stablecoin: 'type-stablecoin',
  }[type] || 'neutral'
  return <span className={`badge ${cls}`}>{type}</span>
}

function PnlCell({ value, cost }) {
  const pnl    = value - cost
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
      <span className={pnl >= 0 ? 'text-green' : 'text-red'} style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
        {pnl >= 0 ? '+' : ''}{fmtEur(pnl)}
      </span>
      {pnlPct !== null && (
        <span style={{ fontSize: '0.68rem', color: pnl >= 0 ? 'var(--green)' : 'var(--red)', opacity: 0.75 }}>
          {fmtPct(pnlPct)}
        </span>
      )}
    </div>
  )
}

export default function Positions({ portfolio, filterBucket, onClearFilter }) {
  const positions = portfolio?.positions || []
  const sectionRefs = useRef({})

  const grouped = BUCKET_ORDER.reduce((acc, b) => {
    acc[b] = positions.filter(p => p.bucket === b)
    return acc
  }, {})

  /* Auto-scroll to the filtered bucket */
  useEffect(() => {
    if (!filterBucket) return
    const el = sectionRefs.current[filterBucket]
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [filterBucket])

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
      {/* Active filter banner */}
      {filterBucket && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.6rem 1rem', marginBottom: '1rem',
          background: BUCKET_COLORS[filterBucket] + '15',
          border: `1px solid ${BUCKET_COLORS[filterBucket]}33`,
          borderRadius: 'var(--radius)',
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 700, color: BUCKET_COLORS[filterBucket] }}>
            {BUCKET_META[filterBucket].emoji} {BUCKET_META[filterBucket].label} — positions
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClearFilter}
            style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}
          >
            Voir tout ×
          </button>
        </div>
      )}

      {BUCKET_ORDER.map(bucket => {
        const group = grouped[bucket]
        if (!group || group.length === 0) return null
        const isHighlighted = filterBucket === bucket
        const isOther       = filterBucket && !isHighlighted

        const bucketTotal = group.reduce((s, p) => s + (p.currentValue || 0), 0)
        const bucketCost  = group.reduce((s, p) => s + (p.costBasis  || 0), 0)
        const bucketPnl   = bucketTotal - bucketCost

        return (
          <div
            key={bucket}
            ref={el => { sectionRefs.current[bucket] = el }}
            className="section"
            style={{
              opacity: isOther ? 0.35 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <div className="section-title">
              <span style={{ color: BUCKET_COLORS[bucket] }}>
                {BUCKET_META[bucket].emoji} {BUCKET_META[bucket].label}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                {bucket !== 'savings' && (
                  <span className={`badge ${bucketPnl >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '0.65rem' }}>
                    {bucketPnl >= 0 ? '+' : ''}{fmtEur(bucketPnl)}
                  </span>
                )}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {fmtEur(bucketTotal)}
                </span>
              </span>
            </div>
            <div
              className="card"
              style={{
                padding: 0, overflow: 'hidden',
                borderColor: isHighlighted ? `${BUCKET_COLORS[bucket]}44` : undefined,
                boxShadow: isHighlighted ? `0 0 20px ${BUCKET_COLORS[bucket]}18` : undefined,
              }}
            >
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
                        <td style={{ fontWeight: 700, color: BUCKET_COLORS[bucket] }}>{p.ticker}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{p.name}</td>
                        <td><TypeBadge type={p.type} /></td>
                        <td className="num" style={{ fontWeight: 700 }}>{fmtEur(p.currentValue)}</td>
                        <td className="num" style={{ color: 'var(--text-secondary)' }}>{fmtEur(p.costBasis)}</td>
                        <td className="num">
                          {p.type === 'Savings'
                            ? <span style={{ color: 'var(--text-muted)' }}>—</span>
                            : <PnlCell value={p.currentValue || 0} cost={p.costBasis || 0} />
                          }
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
