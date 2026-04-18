import { useState, useEffect, useCallback } from 'react'

export function useExpenses() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/expenses')
      if (!res.ok) throw new Error('Failed to fetch expenses')
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const addEntry = useCallback(async (entry) => {
    const res = await fetch('/api/expenses/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    const added = await res.json()
    setData(prev => ({ ...prev, entries: [...prev.entries, added] }))
    return added
  }, [])

  const deleteEntry = useCallback(async (id) => {
    await fetch(`/api/expenses/entries/${id}`, { method: 'DELETE' })
    setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
  }, [])

  const updateBudgets = useCallback(async (budgets) => {
    await fetch('/api/expenses/budgets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
