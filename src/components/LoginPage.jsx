import React, { useState } from 'react'
import { setToken } from '../lib/auth'

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Mot de passe incorrect')
        return
      }
      setToken(data.token)
      onLogin()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      {/* Dot grid texture (matches app body::before) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: 'clamp(1.8rem, 6vw, 2.4rem)',
            letterSpacing: '0.12em',
            background: 'linear-gradient(135deg, #00d4ff, #7c4dff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.3rem',
          }}>
            PATRIMOINE
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.15em',
          }}>
            FINANCE TRACKER
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ width: '100%', padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
                style={{ fontSize: '1rem' }}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.6rem 0.875rem',
                background: 'rgba(255,61,90,0.1)',
                border: '1px solid rgba(255,61,90,0.3)',
                borderRadius: 'var(--radius)',
                color: 'var(--red)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem', padding: '0.75rem' }}
            >
              {loading ? '…' : 'Connexion'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
