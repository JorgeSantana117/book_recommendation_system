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

  if (!b) return <p>Loading…</p>
  return (
    <div style={{maxWidth:700, margin:'20px auto'}}>
      <h2>{b.title}</h2>
      <p><i>{Array.isArray(b.authors)? b.authors.join(', ') : b.authors}</i> — {b.year || ''}</p>
      <p>{b.description}</p>
      <p>Genres: {Array.isArray(b.genres)? b.genres.join(', ') : b.genres}</p>
      <p>Tags: {Array.isArray(b.tags)? b.tags.join(', ') : b.tags}</p>

      <div style={{marginTop:12}}>
        <label>Rate: </label>
        <select value={rating} onChange={e=>setRating(Number(e.target.value))}>
          {[1,2,3,4,5].map(x=> <option key={x} value={x}>{x}</option>)}
        </select>
        <input placeholder='Optional comment' value={comment} onChange={e=>setComment(e.target.value)} style={{marginLeft:8}} />
        <button onClick={onRate} style={{marginLeft:8}}>Submit</button>
        <button onClick={onHide} style={{marginLeft:8}}>Hide</button>
      </div>
      {msg && <p>{msg}</p>}
    </div>
  )
}
