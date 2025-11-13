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

      // fetch user info to persist email and onboarding flag
      try {
        const user = await auth.me()

        const email =
          user?.email ||
          user?.user?.email ||
          user?.login ||
          login

        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('userEmail', email || '')

          // Read onboarding_done from Backendless
          const onboardingDoneValue =
            user?.onboarding_done ?? user?.onboardingDone

          const onboardingDone = Boolean(onboardingDoneValue)

          if (onboardingDone) {
            // User already completed onboarding
            window.localStorage.setItem('onboardingDone', 'true')
            window.localStorage.removeItem('onboardingPending')
          } else {
            // Do NOT mark them as "pending" at login.
            // Only sign-up/onboarding screens manage these flags.
            window.localStorage.removeItem('onboardingPending')
            window.localStorage.removeItem('onboardingDone')
          }
        }
      } catch (e) {
        console.warn('Could not hydrate profile after sign-in', e)
      }

      nav('/catalog')
    } catch (e) {
      setErr(e?.message || 'Sign-in failed')
    }
  }

  return (
    <div className="app-shell">
      <div className="app-shell-inner">
        <div className="auth-page">
          <div className="auth-card">
            <h1 className="auth-title">👋 Welcome back</h1>
            <p className="auth-subtitle">
              Sign in to explore the catalog and get tailored book suggestions.
            </p>

            <form className="form" onSubmit={onSubmit}>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  className="input"
                  placeholder="you@example.com"
                  type="email"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  className="input"
                  placeholder="Your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn mt-md">
                Sign in
              </button>
            </form>

            {err && <div className="alert alert-error">{err}</div>}

            <div className="form-footer">
              <span>Don&apos;t have an account?</span>
              <Link to="/signup" className="link">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
