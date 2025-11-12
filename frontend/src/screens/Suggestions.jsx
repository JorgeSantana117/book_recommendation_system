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
        } else {
          setItems([])
          console.warn('La respuesta de Sugerencias se recibió, pero faltaba el array "items".', res)
        }
        
      } catch (e) {
        // Compose friendly message for the UI and rich debug for console
        let friendly = 'Failed to load suggestions'
        try {
          if (e?.message) friendly = `${friendly}: ${e.message}`
          if (e?.response) {
            const r = e.response
            // build friendly details
            const serverMsg = r.data?.message || r.data?.error || JSON.stringify(r.data)
            friendly = `${friendly}: ${serverMsg} (HTTP ${r.status})`
            console.error('Suggestions load failed (detailed):', {
              url: r.config?.url || '(unknown)',
              method: r.config?.method,
              status: r.status,
              requestBody: r.config?.data,
              responseBody: r.data,
              responseHeaders: r.headers
            })
          } else {
            console.error('Suggestions load error (no response):', e)
          }
        } catch (xx) {
          console.error('Error while preparing Suggestions debug info', xx)
        }
        setErr(friendly)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div style={{maxWidth:900, margin:'20px auto'}}>
      <h2>Suggestions</h2>

      {loading && <p>Loading suggestions…</p>}

      {err && (
        <div style={{background:'#fff4f4', border:'1px solid #ffd0d0', padding:12, borderRadius:6}}>
          <p style={{color:'#a00', margin:0}}><strong>{err}</strong></p>
          <p style={{marginTop:8, marginBottom:0, fontSize:13, color:'#333'}}>Check browser console (Network tab) for full request and response details.</p>
        </div>
      )}

      {!loading && !err && items && items.length === 0 && (
        <p>No suggestions available right now.</p>
      )}

      {!loading && !err && items && items.length > 0 && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12}}>
          {items.map((it, i) => (
            <div key={it.objectId || it.id || i} style={{border:'1px solid #eee', padding:12, borderRadius:8}}>
              <div style={{fontWeight:700}}>{it.title || it.name || 'Untitled'}</div>
              <div style={{fontSize:13, color:'#666', marginTop:6}}>{it.authors || it.subtitle || ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}