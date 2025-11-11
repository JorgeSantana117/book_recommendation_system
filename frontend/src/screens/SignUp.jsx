// frontend/src/screens/SignUp.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../api/backendless'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      // register
      await auth.signUp({ email, password })
      // login right away
      await auth.signIn({ login: email, password })
      // store email and mark onboarding pending for newly created users
      try {
        window.localStorage.setItem('userEmail', email)
        window.localStorage.setItem('onboardingPending', 'true')
        // onboardingDone intentionally false for real account flag; we rely on pending
        window.localStorage.setItem('onboardingDone', 'false')
      } catch (e) { /* ignore localStorage issues */ }
      nav('/onboarding')
    } catch (e) {
      setErr(e?.response?.data?.message || 'Sign up failed')
    }
  }

  return (
    <div style={{maxWidth:400, margin:'40px auto'}}>
      <h2>Sign Up</h2>
      <form onSubmit={onSubmit}>
        <input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',marginBottom:8}} />
        <input placeholder='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',marginBottom:8}} />
        <button type='submit'>Create account</button>
      </form>
      {err && <p style={{color:'crimson'}}>{err}</p>}
      <p>Have an account? <Link to='/signin'>Sign In</Link></p>
    </div>
  )
}
