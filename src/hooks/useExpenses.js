import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '../lib/auth'

export function useExpenses() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/expenses')
      if (!res.ok) throw new Error('Failed to fetch expenses')
      setData(await res.json())
    } catch (e) {
      if (e.message !== 'Session expirée') setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const addEntry = useCallback(async (entry) => {
    const res = await fetchWithAuth('/api/expenses/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    })
    const added = await res.json()
    setData(prev => ({ ...prev, entries: [...prev.entries, added] }))
    return added
  }, [])

  const deleteEntry = useCallback(async (id) => {
    await fetchWithAuth(`/api/expenses/entries/${id}`, { method: 'DELETE' })
    setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
  }, [])

  const updateBudgets = useCallback(async (budgets) => {
    await fetchWithAuth('/api/expenses/budgets', {
      method: 'PUT',
      body: JSON.stringify({ budgets }),
    })
    setData(prev => ({ ...prev, budgets }))
  }, [])

  return {
    expenses: data,
    loading,
    error,
    refetch: fetch_,
    addEntry,
    deleteEntry,
    updateBudgets,
  }
}
