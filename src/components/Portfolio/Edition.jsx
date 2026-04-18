import React, { useState, useCallback } from 'react'
import { fmtEur } from '../shared/chartDefaults'

const BUCKETS = ['equities', 'gold', 'crypto']
const BUCKET_LABELS = { equities: 'Actions', gold: 'Or', crypto: 'Crypto' }
const TYPES = ['Stock', 'ETF', 'Coin', 'Crypto', 'Stablecoin', 'Autre']

const NEW_POSITION_DEFAULTS = {
  ticker: '',
  name: '',
  type: 'Stock',
  bucket: 'equities',
  currentValue: '',
  costBasis: '',
}

export default function Edition({ portfolio, onSave, onAdd, onDelete, setIncome }) {
  const positions = portfolio?.positions || []
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(false)
  const [newPos, setNewPos] = useState(null)
  const [income, setIncomeLocal] = useState(portfolio?.income || 0)
  const [savingIncome, setSavingIncome] = useState(false)

  const getValue = (id, field, fallback) => {
    if (edits[id]?.[field] !== undefined) return edits[id][field]
    return fallback ?? ''
  }

  const setField = (id, field, value) => {
    setEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    const updated = {
      ...portfolio,
      positions: positions.map(p => ({
        ...p,
        currentValue: edits[p.id]?.currentValue !== undefined
          ? Number(edits[p.id].currentValue) : p.currentValue,
        costBasis: edits[p.id]?.costBasis !== undefined
          ? Number(edits[p.id].costBasis) : p.costBasis,
      })),
    }
    await onSave(updated)
    setEdits({})
    setSaving(false)
  }, [edits, positions, portfolio, onSave])

  const handleAddPosition = useCallback(async () => {
    if (!newPos.ticker || !newPos.name) return
    await onAdd({
      ticker: newPos.ticker.toUpperCase(),
      name: newPos.name,
      type: newPos.type,
      bucket: newPos.bucket,
      currentValue: Number(newPos.currentValue) || 0,
      costBasis: Number(newPos.costBasis) || 0,
    })
    setNewPos(null)
  }, [newPos, onAdd])

  const handleSaveIncome = useCallback(async () => {
    setSavingIncome(true)
    await setIncome(Number(income) || 0)
    setSavingIncome(false)
  }, [income, setIncome])

  const grouped = BUCKETS.reduce((acc, b) => {
    acc[b] = positions.filter(p => p.bucket === b)
    return acc
  }, {})

  return (
    <div>
      {/* Income */}
      <div className="section">
        <div className="section-title">Revenu mensuel</div>
        <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">Revenu net mensuel (€)</label>
            <input
              type="number"
              className="form-input"
              value={income}
              onChange={e => setIncomeLocal(e.target.value)}
              min="0"
              step="100"
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleSaveIncome} disabled={savingIncome}>
            {savingIncome ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Positions by bucket */}
      {BUCKETS.map(bucket => (
        <div key={bucket} className="section">
          <div className="section-title">{BUCKET_LABELS[bucket]}</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticker / Nom</th>
                    <th>Type</th>
                    <th className="num">Valeur actuelle (€)</th>
                    <th className="num">PRU (€)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[bucket].map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)' }}>{p.ticker}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.name}</div>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                          value={getValue(p.id, 'type', p.type)}
                          onChange={e => setField(p.id, 'type', e.target.value)}
                        >
                          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          className="form-input"
                          style={{ textAlign: 'right', maxWidth: 140 }}
                          value={getValue(p.id, 'currentValue', p.currentValue)}
                          onChange={e => setField(p.id, 'currentValue', e.target.value)}
                          min="0"
                          step="1"
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          className="form-input"
                          style={{ textAlign: 'right', maxWidth: 140 }}
                          value={getValue(p.id, 'costBasis', p.costBasis)}
                          onChange={e => setField(p.id, 'costBasis', e.target.value)}
                          min="0"
                          step="1"
                        />
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => onDelete(p.id)} title="Supprimer">✕</button>
                      </td>
                    </tr>
                  ))}
                  {grouped[bucket].length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                        Aucune position dans ce bucket
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Save button */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde…' : '💾 Sauvegarder les positions'}
        </button>
        <button className="btn btn-secondary" onClick={() => setNewPos({ ...NEW_POSITION_DEFAULTS })}>
          + Ajouter une position
        </button>
      </div>

      {/* Add position form */}
      {newPos && (
        <div className="card section">
          <div className="card-title">Nouvelle position</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Ticker</label>
              <input className="form-input" value={newPos.ticker} onChange={e => setNewPos(p => ({ ...p, ticker: e.target.value }))} placeholder="AAPL" />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input className="form-input" value={newPos.name} onChange={e => setNewPos(p => ({ ...p, name: e.target.value }))} placeholder="Apple Inc." />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={newPos.type} onChange={e => setNewPos(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bucket</label>
              <select className="form-select" value={newPos.bucket} onChange={e => setNewPos(p => ({ ...p, bucket: e.target.value }))}>
                {BUCKETS.map(b => <option key={b} value={b}>{BUCKET_LABELS[b]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Valeur actuelle (€)</label>
              <input type="number" className="form-input" value={newPos.currentValue} onChange={e => setNewPos(p => ({ ...p, currentValue: e.target.value }))} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">PRU (€)</label>
              <input type="number" className="form-input" value={newPos.costBasis} onChange={e => setNewPos(p => ({ ...p, costBasis: e.target.value }))} min="0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleAddPosition}>Ajouter</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setNewPos(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
