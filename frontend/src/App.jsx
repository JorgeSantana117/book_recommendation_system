// frontend/src/App.jsx
import React from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import SignIn from './screens/SignIn'
import SignUp from './screens/SignUp'
import Onboarding from './screens/Onboarding'
import Catalog from './screens/Catalog'
import Suggestions from './screens/Suggestions'
import BookDetail from './screens/BookDetail'
import { getToken, auth } from './api/backendless'

const Nav = () => {
  const loc = useLocation()
  const nav = useNavigate()

  // Read localStorage flags synchronously (kept for backwards compatibility elsewhere)
  const onboardingPending =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('onboardingPending') === 'true'
  const onboardingDoneFlag =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('onboardingDone')
      : null
  const onboardingDone = onboardingDoneFlag === 'true'

  // Hide the nav on sign-in / signup / root only (DO NOT hide for /onboarding anymore)
  const hideNav =
    loc.pathname === '/' ||
    loc.pathname === '/signin' ||
    loc.pathname === '/signup'
  if (hideNav) return null

  const token = getToken()
  const signedIn = Boolean(token)
  const email =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('userEmail')
      : null

  const onSignOut = async () => {
    try {
      await auth.logout()
    } catch (e) {
      // ignore errors
    }
    try {
      // clear client-side stored auth and onboarding metadata
      window.localStorage.removeItem('userToken')
      window.localStorage.removeItem('userEmail')
      window.localStorage.removeItem('onboardingPending')
      window.localStorage.removeItem('onboardingDone')
    } catch (e) {}
    nav('/signin')
  }

  const isActive = (path) =>
    loc.pathname === path || loc.pathname.startsWith(path + '/')

  return (
    <nav className="nav">
      <div className="nav-left">
        <div className="nav-logo" aria-hidden="true">📚</div>
        <div>
          <div className="nav-text-main">Book Recommender</div>
          <div className="nav-text-sub">
            Your personal reading companion
          </div>
        </div>
      </div>

      <div className="nav-center">
        <Link
          to="/catalog"
          className={`nav-link ${isActive('/catalog') ? 'nav-link--active' : ''}`}
        >
          Catalog
        </Link>
        <Link
          to="/suggestions"
          className={`nav-link ${isActive('/suggestions') ? 'nav-link--active' : ''}`}
        >
          Suggestions
        </Link>
        <Link
          to="/onboarding"
          className={`nav-link ${isActive('/onboarding') ? 'nav-link--active' : ''}`}
        >
          Preferences
        </Link>
      </div>

      <div className="nav-right">
        {signedIn ? (
          <>
            <span className="nav-user">
              Hi, {email || 'Reader'}
              {onboardingPending && !onboardingDone ? ' (finish onboarding)' : ''}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <Link className="btn btn-ghost btn-sm" to="/signin">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}

const Protected = ({ children }) => {
  const token = getToken()
  if (!token) return <Navigate to="/signin" replace />
  return children
}

export default function App() {
  return (
    <div className="app-shell">
      <div className="app-shell-inner">
        <Nav />
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/suggestions"
            element={
              <Protected>
                <Suggestions />
              </Protected>
            }
          />
          <Route
            path="/catalog"
            element={
              <Protected>
                <Catalog />
              </Protected>
            }
          />
          <Route
            path="/books/:id"
            element={
              <Protected>
                <BookDetail />
              </Protected>
            }
          />
          <Route
            path="/onboarding"
            element={
              <Protected>
                <Onboarding />
              </Protected>
            }
          />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
