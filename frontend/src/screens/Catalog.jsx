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
      const res = await books.list({ q, language, format, rating_min: rating, pageSize: 20 })
      setItems(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{maxWidth:900, margin:'20px auto'}}>
      <h2>Catalog</h2>
      <div style={{display:'flex', gap:8}}>
        <input placeholder='Search title...' value={q} onChange={e=>setQ(e.target.value)} />
        <select value={language} onChange={e=>setLanguage(e.target.value)}>
          <option value=''>language</option>
          <option value='en'>en</option>
          <option value='es'>es</option>
        </select>
        <select value={format} onChange={e=>setFormat(e.target.value)}>
          <option value=''>format</option>
          <option value='ebook'>ebook</option>
          <option value='audiobook'>audiobook</option>
          <option value='print'>print</option>
        </select>
        <select value={rating} onChange={e=>setRating(e.target.value)}>
          <option value=''>min rating</option>
          <option value='3'>3</option>
          <option value='4'>4</option>
          <option value='4.5'>4.5</option>
        </select>
        <button onClick={load}>Search</button>
      </div>
      {loading && <p>Loading…</p>}
      <ul>
        {Array.isArray(items) && items.map(b => (
          <li key={b.objectId || b.id}>
            <Link to={`/books/${b.objectId || b.id}`}>{b.title}</Link> — {b.authors}
          </li>
        ))}
      </ul>
    </div>
  )
}
