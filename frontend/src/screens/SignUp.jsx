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
      await auth.signUp({ email, password })
      await auth.signIn({ login: email, password })

      try {
        const user = await auth.me()
        const userEmail = user?.email || user?.user?.email || email
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('userEmail', userEmail || '')
          window.localStorage.setItem('onboardingPending', 'true')
          window.localStorage.removeItem('onboardingDone')
        }
      } catch (e) {
        console.warn('Could not hydrate profile after sign-up', e)
      }

      nav('/onboarding')
    } catch (e) {
      setErr(e?.message || 'Sign-up failed')
    }
  }

  return (
    <div className="app-shell">
      <div className="app-shell-inner">
        <div className="auth-page">
          <div className="auth-card">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">
              A few clicks and you&apos;ll start receiving personalized book
              suggestions.
            </p>

            <form className="form" onSubmit={onSubmit}>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  className="input"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  className="input"
                  placeholder="Choose a secure password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn mt-md">
                Create account
              </button>
            </form>

            {err && <div className="alert alert-error">{err}</div>}

            <div className="form-footer">
              <span>Already have an account?</span>
              <Link to="/signin" className="link">
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
