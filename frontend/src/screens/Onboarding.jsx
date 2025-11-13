// frontend/src/screens/Onboarding.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profile } from '../api/backendless'

const GENRES = [
  'Science Fiction', 'Fantasy', 'Mystery & Thriller', 'Romance',
  'Historical Fiction', 'Literary Fiction', 'Contemporary Fiction',
  'Horror', 'Young Adult', 'Children’s', 'Biography & Memoir',
  'History', 'Science & Technology', 'Business & Economics',
  'Self-Help & Personal Development', 'Education & Teaching',
  'Computer Science & Programming', 'Data Science & AI',
  'Psychology', 'Art & Design'
]

export default function Onboarding() {
  const [genres, setGenres] = useState([])
  const [formats, setFormats] = useState(['ebook'])
  const [language, setLanguage] = useState('en')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const toggleGenre = (g) =>
    setGenres((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]))

  const toggleFormat = (key) => (e) => {
    const checked = e.target.checked
    setFormats((s) =>
      checked ? [...s, key] : s.filter((x) => x !== key)
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (genres.length < 3) {
      setErr('Pick at least 3 genres (or press Skip).')
      return
    }
    try {
      await profile.update({
        preferred_genres: genres.join(';'),
        preferred_formats: formats.join(';'),
        language_pref: language,
        onboarding_done: true
      })
      try {
        window.localStorage.removeItem('onboardingPending')
        window.localStorage.setItem('onboardingDone', 'true')
      } catch (e) {}
      nav('/catalog')
    } catch (e) {
      let friendly = 'Failed to save preferences'
      try {
        if (e?.message) friendly = e.message
        if (e?.response) {
          const r = e.response
          const serverMsg =
            r.data?.message || r.data?.error || JSON.stringify(r.data)
          friendly = `${friendly}: ${serverMsg} (HTTP ${r.status})`
          console.error('Onboarding save failed: request details:', {
            url: r.config?.url || '(unknown)',
            method: r.config?.method,
            status: r.status,
            requestBody: r.config?.data,
            responseBody: r.data,
            responseHeaders: r.headers
          })
        } else {
          console.error('Onboarding save error (no response):', e)
        }
      } catch (xx) {
        console.error('Error while preparing debug info', xx)
      }
      setErr(friendly)
    }
  }

  const onSkip = () => {
    try {
      window.localStorage.removeItem('onboardingPending')
      window.localStorage.setItem('onboardingDone', 'true')
    } catch (e) {}
    nav('/catalog')
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">🎯 Fine-tune your recommendations</h1>
          <p className="page-subtitle">
            Choose what you like to read so we can suggest better books.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="form">
        <div className="form-field">
          <label className="form-label">
            Favorite genres <span style={{ color: '#facc15' }}>*</span>
          </label>
          <p className="text-muted">
            Pick at least three genres. You can always update this later.
          </p>
          <div className="chip-grid">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                className={`chip ${genres.includes(g) ? 'chip--selected' : ''}`}
                onClick={() => toggleGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field mt-md">
          <label className="form-label">Preferred formats</label>
          <div className="form-row">
            <label className="text-muted">
              <input
                type="checkbox"
                checked={formats.includes('ebook')}
                onChange={toggleFormat('ebook')}
                style={{ marginRight: 6 }}
              />
              E-book
            </label>
            <label className="text-muted">
              <input
                type="checkbox"
                checked={formats.includes('audiobook')}
                onChange={toggleFormat('audiobook')}
                style={{ marginRight: 6 }}
              />
              Audiobook
            </label>
            <label className="text-muted">
              <input
                type="checkbox"
                checked={formats.includes('print')}
                onChange={toggleFormat('print')}
                style={{ marginRight: 6 }}
              />
              Print
            </label>
          </div>
        </div>

        <div className="form-field mt-md" style={{ maxWidth: 220 }}>
          <label className="form-label">Language</label>
          <select
            className="select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English (EN)</option>
            <option value="es">Spanish (ES)</option>
          </select>
        </div>

        <div className="mt-md" style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn">
            Save &amp; continue
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onSkip}
          >
            Skip for now
          </button>
        </div>

        {err && <div className="alert alert-error">{err}</div>}
      </form>
    </div>
  )
}
