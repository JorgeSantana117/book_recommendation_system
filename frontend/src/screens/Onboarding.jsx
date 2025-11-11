// frontend/src/screens/Onboarding.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profile } from '../api/backendless'

const GENRES = [
  'Science Fiction','Fantasy','Mystery & Thriller','Romance','Historical Fiction','Literary Fiction',
  'Contemporary Fiction','Horror','Young Adult','Children’s','Biography & Memoir','History','Science & Technology',
  'Business & Economics','Self-Help & Personal Development','Education & Teaching','Computer Science & Programming',
  'Data Science & AI','Psychology','Art & Design'
]

export default function Onboarding() {
  const [genres, setGenres] = useState([])
  const [formats, setFormats] = useState(['ebook'])
  const [language, setLanguage] = useState('en')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const toggle = (g) => setGenres(s => s.includes(g) ? s.filter(x=>x!==g) : [...s,g])

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
      // Clear onboardingPending flag and set onboardingDone true
      try {
        window.localStorage.removeItem('onboardingPending')
        window.localStorage.setItem('onboardingDone', 'true')
      } catch (e) {}
      nav('/')
    } catch (e) {
      // Show helpful info in the UI and console
      let friendly = 'Failed to save preferences'
      try {
        // e may be an Error with message or an axios error with response
        if (e?.message) friendly = e.message
        if (e?.response) {
          const r = e.response
          // try to extract message from Backendless structured response
          const serverMsg = r.data?.message || r.data?.error || JSON.stringify(r.data)
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
          // generic error
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
    nav('/')
  }

  return (
    <div style={{maxWidth:800, margin:'20px auto'}}>
      <h2>Onboarding</h2>
      <p>Select at least 3 genres</p>
      <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
        {GENRES.map(g => (
          <button key={g} type='button' onClick={()=>toggle(g)}
            style={{padding:'6px 10px', borderRadius:16, border:'1px solid #ccc', background: genres.includes(g)?'#e0f3ff':'#fff'}}>{g}</button>
        ))}
      </div>

      <div style={{marginTop:16}}>
        <label>Preferred formats: </label>
        <label><input type='checkbox' checked={formats.includes('ebook')} onChange={e=> setFormats(s=> e.target.checked? [...s,'ebook']: s.filter(x=>x!=='ebook'))}/> ebook</label>
        <label style={{marginLeft:8}}><input type='checkbox' checked={formats.includes('audiobook')} onChange={e=> setFormats(s=> e.target.checked? [...s,'audiobook']: s.filter(x=>x!=='audiobook'))}/> audiobook</label>
        <label style={{marginLeft:8}}><input type='checkbox' checked={formats.includes('print')} onChange={e=> setFormats(s=> e.target.checked? [...s,'print']: s.filter(x=>x!=='print'))}/> print</label>
      </div>

      <div style={{marginTop:16}}>
        <label>Language: </label>
        <select value={language} onChange={e=>setLanguage(e.target.value)}>
          <option value='en'>en</option>
          <option value='es'>es</option>
        </select>
      </div>

      <div style={{marginTop:16}}>
        <button onClick={onSubmit}>Save & Continue</button>
        <button style={{marginLeft:8}} onClick={onSkip}>Skip</button>
      </div>
      {err && <p style={{color:'crimson', whiteSpace:'pre-wrap'}}>{err}</p>}
    </div>
  )
}
