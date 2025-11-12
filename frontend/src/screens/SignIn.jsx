// frontend/src/screens/SignIn.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../api/backendless'

export default function SignIn() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await auth.signIn({ login, password })
      // fetch user info to persist email and onboarding flag synchronously
      try {
        const user = await auth.me()
        const email = user?.email || user?.user?.email || user?.login || login
        const onboardingDone = (user?.onboarding_done === true || String(user?.onboarding_done) === 'true') ? 'true' : 'false'
        try {
          window.localStorage.setItem('userEmail', email)
          window.localStorage.setItem('onboardingDone', onboardingDone)
          // clear onboardingPending if previously set for some reason (signin means it's not a fresh signup)
          window.localStorage.removeItem('onboardingPending')
        } catch (e) { /* ignore localStorage errors */ }
      } catch (e) {
        // fallback: store email as login and conservative onboardingDone = 'true' (assume existing user)
        try {
          window.localStorage.setItem('userEmail', login)
          window.localStorage.setItem('onboardingDone', 'true')
          window.localStorage.removeItem('onboardingPending')
        } catch {}
      }
      // go to catalog
      nav('/catalog')
    } catch (e) {
      setErr(e?.response?.data?.message || 'Sign in failed')
    }
  }

  return (
    <div style={{maxWidth:400, margin:'40px auto'}}>
      <h2>Sign In</h2>
      <form onSubmit={onSubmit}>
        <input placeholder='Email' value={login} onChange={e=>setLogin(e.target.value)} style={{width:'100%',marginBottom:8}} />
        <input placeholder='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',marginBottom:8}} />
        <button type='submit'>Sign In</button>
      </form>
      {err && <p style={{color:'crimson'}}>{err}</p>}
      <p>No account? <Link to='/signup'>Sign Up</Link></p>
    </div>
  )
}
