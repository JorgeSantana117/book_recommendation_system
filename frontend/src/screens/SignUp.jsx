// frontend/src/screens/SignUp.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../api/backendless'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)

    try {
      // 1) Try to register
      await auth.signUp({ email, password })

      // 2) Auto-login
      await auth.signIn({ login: email, password })

      // 3) Fetch user, set local flags
      try {
        const user = await auth.me()
        const userEmail = user?.email || user?.user?.email || email

        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('userEmail', userEmail || '')
          // New user → onboarding still pending
          window.localStorage.setItem('onboardingPending', 'true')
          window.localStorage.removeItem('onboardingDone')
        }
      } catch (e) {
        console.warn('Could not hydrate profile after sign-up', e)
      }

      // 4) Go to onboarding
      nav('/onboarding')
    } catch (e) {
      // Map Backendless errors to friendlier text
      let message = 'Sign-up failed'

      const status = e?.response?.status
      const serverCode = e?.response?.data?.code
      const serverMsg = e?.response?.data?.message

      if (status === 409 && serverCode === 3033) {
        // User already exists
        message =
          'A user with this email already exists. Try signing in instead.'
      } else if (serverMsg) {
        message = serverMsg
      } else if (e?.message) {
        message = e.message
      }

      setErr(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="app-shell-inner">
        <div className="auth-page">
          <div className="auth-card">
            <h1 className="auth-title">✨ Create your account</h1>
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

              <button type="submit" className="btn mt-md" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            {err && (
              <div className="alert alert-error">
                <div>{err}</div>
                {err.includes('already exists') && (
                  <div style={{ marginTop: 6, fontSize: '0.8rem' }}>
                    You can{' '}
                    <Link to="/signin" className="link">
                      go to Sign in
                    </Link>{' '}
                    and use this email to log in.
                  </div>
                )}
              </div>
            )}

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
