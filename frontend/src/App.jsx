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
  const onboardingPending = typeof window !== 'undefined' && window.localStorage.getItem('onboardingPending') === 'true'
  const onboardingDoneFlag = typeof window !== 'undefined' ? window.localStorage.getItem('onboardingDone') : null
  const onboardingDone = onboardingDoneFlag === 'true'

  // Hide the nav on sign-in / signup / root only (DO NOT hide for /onboarding anymore)
  const hideNav = loc.pathname === '/' || loc.pathname === '/signin' || loc.pathname === '/signup'
  if (hideNav) return null

  const token = getToken()
  const signedIn = Boolean(token)

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

  // Now: always render the Onboarding tab when signed in
  const email = typeof window !== 'undefined' ? window.localStorage.getItem('userEmail') : null

  return (
    <nav style={{display:'flex', gap:12, padding:12, borderBottom:'1px solid #eee'}}>
      <Link to="/suggestions">Suggestions</Link>
      <Link to="/catalog">Catalog</Link>
      <Link to="/onboarding">Onboarding</Link>

      <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8}}>
        {signedIn ? (
          <>
            <span>Hi, {email || 'User'}</span>
            <button onClick={onSignOut}>Sign Out</button>
          </>
        ) : (
          <Link to="/signin">Sign In</Link>
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
    <div>
      <Nav />
      <Routes>
        <Route path="/" element={<SignIn/>} />
        <Route path="/signin" element={<SignIn/>} />
        <Route path="/suggestions" element={<Protected><Suggestions/></Protected>} />
        <Route path="/catalog" element={<Protected><Catalog/></Protected>} />
        <Route path="/books/:id" element={<Protected><BookDetail/></Protected>} />
        <Route path="/onboarding" element={<Protected><Onboarding/></Protected>} />
        <Route path="/signup" element={<SignUp/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
