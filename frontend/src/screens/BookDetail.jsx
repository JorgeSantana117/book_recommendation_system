import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { books, interactions } from '../api/backendless'

export default function BookDetail() {
  const { id } = useParams()
  const [b, setB] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    books.get(id).then(setB)
  }, [id])

  const onRate = async () => {
    await interactions.rate({ book_id: b.id || b.objectId, rating, comment })
    setMsg('Thanks! Suggestions will refresh.')
  }

  const onHide = async () => {
    await interactions.hide({ book_id: b.id || b.objectId })
    setMsg('Hidden. This title will not appear in Suggestions.')
  }

  if (!b) return <p className="text-muted">Loading…</p>

  const authors = Array.isArray(b.authors) ? b.authors.join(', ') : b.authors
  const genres = Array.isArray(b.genres)
    ? b.genres
    : typeof b.genres === 'string'
    ? b.genres.split(/[;,]/).map((x) => x.trim()).filter(Boolean)
    : []
  const tags = Array.isArray(b.tags)
    ? b.tags
    : typeof b.tags === 'string'
    ? b.tags.split(/[;,]/).map((x) => x.trim()).filter(Boolean)
    : []

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{b.title}</h1>
          <p className="detail-meta">
            <i>{authors || 'Unknown author'}</i>
            {b.year ? ` · ${b.year}` : ''}
          </p>
        </div>
      </header>

      {b.description && (
        <>
          <div className="detail-section-title">Description</div>
          <p>{b.description}</p>
        </>
      )}

      {genres.length > 0 && (
        <>
          <div className="detail-section-title">Genres</div>
          <div className="pills">
            {genres.map((g) => (
              <span className="pill" key={g}>
                {g}
              </span>
            ))}
          </div>
        </>
      )}

      {tags.length > 0 && (
        <>
          <div className="detail-section-title">Tags</div>
          <div className="pills">
            {tags.map((t) => (
              <span className="pill" key={t}>
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="detail-section-title mt-md">Your feedback</div>
      <div className="detail-actions">
        <label className="form-label" style={{ marginBottom: 0 }}>
          Rating
        </label>
        <select
          className="select select-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((x) => (
            <option key={x} value={x}>
              {x} ★
            </option>
          ))}
        </select>
        <input
          className="input input-sm"
          placeholder="Optional comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button className="btn btn-sm" onClick={onRate}>
          Submit
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onHide}>
          Hide
        </button>
      </div>

      {msg && <p className="mt-sm text-muted">{msg}</p>}
    </div>
  )
}
