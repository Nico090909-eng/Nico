import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '../lib/auth'

export function usePortfolio() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/portfolio')
      if (!res.ok) throw new Error('Failed to fetch portfolio')
      setData(await res.json())
    } catch (e) {
      if (e.message !== 'Session expirée') setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const saveAll = useCallback(async (updated) => {
    await fetchWithAuth('/api/portfolio', {
      method: 'PUT',
      body: JSON.stringify(updated),
    })
    setData(updated)
  }, [])

  const addPosition = useCallback(async (position) => {
    const res = await fetchWithAuth('/api/portfolio/positions', {
      method: 'POST',
      body: JSON.stringify(position),
    })
    const added = await res.json()
    setData(prev => ({ ...prev, positions: [...prev.positions, added] }))
  }, [])

  const updatePosition = useCallback(async (id, updates) => {
    await fetchWithAuth(`/api/portfolio/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    setData(prev => ({
      ...prev,
      positions: prev.positions.map(p => p.id === id ? { ...p, ...updates } : p),
    }))
  }, [])

  const deletePosition = useCallback(async (id) => {
    await fetchWithAuth(`/api/portfolio/positions/${id}`, { method: 'DELETE' })
    setData(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p.id !== id),
    }))
  }, [])

  const addSnapshot = useCallback(async (snapshot) => {
    await fetchWithAuth('/api/portfolio/snapshots', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    })
    await fetch_()
  }, [fetch_])

  const deleteSnapshot = useCallback(async (date) => {
    await fetchWithAuth(`/api/portfolio/snapshots/${encodeURIComponent(date)}`, { method: 'DELETE' })
    setData(prev => ({
      ...prev,
      snapshots: prev.snapshots.filter(s => s.date !== date),
    }))
  }, [])

  const setIncome = useCallback(async (income) => {
    await fetchWithAuth('/api/portfolio/income', {
      method: 'PUT',
      body: JSON.stringify({ income }),
    })
    setData(prev => ({ ...prev, income }))
  }, [])

  return {
    portfolio: data,
    loading,
    error,
    refetch: fetch_,
    saveAll,
    addPosition,
    updatePosition,
    deletePosition,
    addSnapshot,
    deleteSnapshot,
    setIncome,
  }
}
