import React, { useEffect, useState } from 'react'
import { books } from '../api/backendless'
import { Link } from 'react-router-dom'

export default function Catalog() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [language, setLanguage] = useState('')
  const [format, setFormat] = useState('')
  const [rating, setRating] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await books.search({ q, language, format, rating })
      setItems(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error('Catalog load failed', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderAuthors = (b) => {
    const a = Array.isArray(b.authors) ? b.authors.join(', ') : b.authors
    return a || 'Unknown author'
  }

  const renderGenres = (b) => {
    const g = Array.isArray(b.genres)
      ? b.genres
      : typeof b.genres === 'string'
      ? b.genres.split(/[;,]/).map((x) => x.trim()).filter(Boolean)
      : []
    return g
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">📚 Catalog</h1>
          <p className="page-subtitle">
            Browse the full library and open any title for details, rating and feedback.
          </p>
        </div>
      </header>

      <div className="filters-bar">
        <label>Search</label>
        <input
          className="input input-sm"
          placeholder="Title or author…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label>Lang</label>
        <select
          className="select select-sm"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">Any</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
        <label>Format</label>
        <select
          className="select select-sm"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="">Any</option>
          <option value="ebook">E-book</option>
          <option value="audiobook">Audiobook</option>
          <option value="print">Print</option>
        </select>
        <label>Min rating</label>
        <select
          className="select select-sm"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          <option value="">Any</option>
          <option value="3">3★</option>
          <option value="4">4★</option>
          <option value="4.5">4.5★</option>
        </select>
        <button className="btn btn-sm" onClick={load}>
          Search
        </button>
      </div>

      {loading && <p className="text-muted mt-sm">Loading…</p>}

      {!loading && items && items.length === 0 && (
        <p className="text-muted mt-sm">No books found with the current filters.</p>
      )}

      {!loading && items && items.length > 0 && (
        <div className="catalog-grid">
          {items.map((b) => (
            <article key={b.objectId || b.id} className="book-card">
              <h2 className="book-card-title">
                <Link to={`/books/${b.objectId || b.id}`}>{b.title}</Link>
              </h2>
              <div className="book-card-meta">
                {renderAuthors(b)} {b.year ? `· ${b.year}` : ''}
              </div>
              {b.description && (
                <p className="book-card-description">
                  {String(b.description).slice(0, 140)}
                  {String(b.description).length > 140 ? '…' : ''}
                </p>
              )}
              <div className="pills">
                {renderGenres(b).slice(0, 4).map((g) => (
                  <span className="pill" key={g}>
                    {g}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
