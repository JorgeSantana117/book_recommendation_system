// frontend/src/screens/Suggestions.jsx
import React, { useEffect, useState } from 'react'
import { services } from '../api/backendless'

export default function Suggestions() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await services.getSuggestions()
        if (!mounted) return

        if (res && Array.isArray(res.items)) {
          setItems(res.items)
        } else if (Array.isArray(res)) {
          setItems(res)
        } else {
          setItems([])
        }
      } catch (e) {
        console.error('Suggestions error', e)
        setErr(
          'Could not load suggestions. Check your Backendless configuration or see the browser console (Network tab) for full request and response details.'
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">✨ Suggestions</h1>
          <p className="page-subtitle">
            Titles recommended based on your feedback, ratings and hidden items.
          </p>
        </div>
      </header>

      {loading && <p className="text-muted">Loading suggestions…</p>}

      {err && !loading && <div className="alert alert-error">{err}</div>}

      {!loading && !err && items && items.length === 0 && (
        <p className="text-muted mt-md">
          No suggestions available right now. Try rating or hiding some books
          in the catalog first.
        </p>
      )}

      {!loading && !err && items && items.length > 0 && (
        <div className="suggestions-grid">
          {items.map((it, i) => (
            <div
              key={it.objectId || it.id || i}
              className="suggestion-card"
            >
              <div className="suggestion-title">
                {it.title || it.name || 'Untitled'}
              </div>
              <div className="suggestion-subtitle">
                {it.authors || it.subtitle || ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
