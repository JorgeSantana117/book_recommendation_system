// frontend/src/api/backendless.js
// Complete Backendless client helper used by the frontend
import axios from 'axios'

const APP_ID = import.meta.env.VITE_BL_APP_ID
const REST_KEY = import.meta.env.VITE_BL_REST_KEY
const API_BASE = import.meta.env.VITE_BL_API_BASE || 'https://api.backendless.com'
const SUBDOMAIN = import.meta.env.VITE_BL_SUBDOMAIN
const SUGGESTIONS_LIMIT = Number(import.meta.env.VITE_SUGGESTIONS_LIMIT || 20)

// ----------------------
// Token helpers
// ----------------------
const storage = typeof window !== 'undefined' ? window.localStorage : null

export function setToken(token) {
  try {
    if (storage) {
      storage.setItem('userToken', token)
      // lightweight notification for other parts of the app (optional listeners)
      try { window.dispatchEvent(new Event('authChanged')) } catch (e) {}
    }
  } catch (e) {
    console.warn('setToken failed', e)
  }
}
export function getToken() {
  try { return storage ? storage.getItem('userToken') : null } catch { return null }
}
export function clearToken() {
  try {
    if (storage) {
      storage.removeItem('userToken')
      try { window.dispatchEvent(new Event('authChanged')) } catch (e) {}
    }
  } catch (e) {
    console.warn('clearToken failed', e)
  }
}

// ----------------------
// axios instance for Backendless Data API
// BaseURL: https://api.backendless.com/{APP_ID}/{REST_KEY}
// ----------------------
const rest = axios.create({
  baseURL: `${API_BASE}/${APP_ID}/${REST_KEY}`
})

// Attach user-token header automatically when present
rest.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers['user-token'] = token
  }
  return config
}, (error) => Promise.reject(error))

// ----------------------
// Auth helpers
// ----------------------
export const auth = {
  /**
   * Register a new user (Backendless users/register)
   * Returns the raw response object from Backendless register endpoint.
   */
  async signUp({ email, password, preferred_genres = '', preferred_formats = '', language_pref = 'en' }) {
    const body = { email, password, preferred_genres, preferred_formats, language_pref, onboarding_done: false }
    const res = await rest.post('/users/register', body)
    return res.data
  },

  /**
   * login: calls Backendless /users/login
   * Stores the returned user-token in localStorage via setToken()
   */
  async signIn({ login, password }) {
    const res = await rest.post('/users/login', { login, password })
    const data = res.data

    // token
    const token = data?.['user-token'] || data?.userToken
    if (token) setToken(token)

    // store email + objectId for later
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const email = data?.email || login || ''
        window.localStorage.setItem('userEmail', email)

        const userId =
          data?.objectId ||
          data?.objectID ||
          data?.id ||
          data?.user?.objectId ||
          data?.user?.id

        if (userId) {
          window.localStorage.setItem('userObjectId', String(userId))
        }
      }
    } catch (_) {
      // non-fatal
    }

    return data
  },

  /**
   * Logout: clears local token and calls Backendless logout route if available.
   * Backendless logout endpoint is /users/logout
   */
async logout() {
  try {
    const token = getToken();
    if (token) {
      // REST logout is a GET and requires the user-token header
      const url = `${API_BASE}/${APP_ID}/${REST_KEY}/users/logout`;
      await axios.get(url, { headers: { 'user-token': token } });
    }
  } catch (e) {
    // non-fatal; we'll clear local state anyway
    console.warn('logout request failed (ignored):', e?.response?.status || e);
  } finally {
    // always clear local session
    clearToken();
    try { if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('userEmail');
      window.localStorage.removeItem('userObjectId');
      window.localStorage.removeItem('onboardingDone');
      window.localStorage.removeItem('onboardingPending');
    }} catch (_) {}
  }
},

  /**
   * me(): return full Users row for the current token
   * Strategy:
   *   1) Try objectId from localStorage -> GET /data/Users/{objectId}
   *   2) Fallback: try to find by email -> GET /data/Users?where=email='...'
   */
  async me() {
    const token = getToken()
    if (!token) return null

    // helper to safely read localStorage
    const getFromStorage = (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key)
        }
      } catch (_) {}
      return null
    }

    // 1) Try with objectId we saved at login
    let objectId = getFromStorage('userObjectId')
    if (objectId) {
      try {
        const res = await rest.get(`/data/Users/${objectId}`)
        if (res?.data) return res.data
      } catch (e) {
        console.warn('auth.me(): failed by objectId, will fallback to email', e)
      }
    }

    // 2) Fallback: find by email
    const email = getFromStorage('userEmail')
    if (!email) return null

    try {
      const where = `email='${String(email).replace(/'/g, "''")}'`
      const res = await rest.get(
        `/data/Users?where=${encodeURIComponent(where)}&pageSize=1`
      )
      const rows = res.data
      if (Array.isArray(rows) && rows.length > 0) {
        const user = rows[0]
        // cache objectId for next time
        const uid =
          user?.objectId || user?.objectID || user?.id
        if (uid) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('userObjectId', String(uid))
            }
          } catch (_) {}
        }
        return user
      }
    } catch (e) {
      console.warn('auth.me(): lookup by email failed', e)
    }

    return null
  }
}


// ----------------------
// Current user helpers
// ----------------------
export async function currentUserId() {
  // Try auth.me() first
  try {
    const me = await auth.me();
    const oid = me?.objectId || me?.id || me?.user?.objectId || me?.userId || me?.user?.id;
    if (oid) return oid;
  } catch (e) {
    // ignore
  }
  // Fallback: try to get Users row by email stored locally (if any)
  try {
    const email = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('userEmail') : null;
    if (email) {
      const where = `email='${String(email).replace(/'/g, "''")}'`;
      const res = await rest.get(`/data/Users?where=${encodeURIComponent(where)}&pageSize=1`);
      const rows = res.data;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0].objectId || rows[0].id || rows[0].objectID;
      }
    }
  } catch (_) {}
  return null;
}
// ----------------------
// Books API
// ----------------------

// internal helper that does the actual listing
async function listBooks({
  q = '',
  genre = '',
  format = '',
  language = '',
  rating_min = '',
  page = 0,
  pageSize = 20
} = {}) {
  const whereClauses = []

  // Escape single quotes for SQL-like where clauses
  const esc = (s) => String(s).replace(/'/g, "''")

  if (language) whereClauses.push(`language='${esc(language)}'`)
  if (format) whereClauses.push(`format='${esc(format)}'`)
  if (rating_min !== '' && rating_min !== null && rating_min !== undefined) {
    const rn = Number(rating_min)
    if (!Number.isNaN(rn)) whereClauses.push(`rating_avg>=${rn}`)
  }
  if (genre) {
    // genres stored as semicolon delimited string -> use LIKE match
    whereClauses.push(`genres LIKE '%${esc(genre)}%'`)
  }

  // Title keyword search (simple contains). Escape single quotes only.
  if (q) {
    const safeQ = esc(q)
    whereClauses.push(`title LIKE '%${safeQ}%'`)
  }

  const params = { pageSize, offset: page * pageSize }
  const query = new URLSearchParams(params)
  if (whereClauses.length) query.append('where', whereClauses.join(' AND '))

  const res = await rest.get(`/data/Books?${query.toString()}`)
  return res.data
}

export const books = {
  /**
   * list books with optional filters (old API, still works)
   */
  list: listBooks,

  /**
   * search: API used by Catalog.jsx
   * maps (q, language, format, rating) -> listBooks(...)
   */
  async search({ q = '', language = '', format = '', rating = '' } = {}) {
    const rating_min =
      rating === '' || rating === null || rating === undefined
        ? ''
        : Number(rating)
    // reuse the same logic as listBooks, with a larger default pageSize
    return listBooks({
      q,
      language,
      format,
      rating_min,
      page: 0,
      pageSize: 50
    })
  },

  async get(id) {
    const res = await rest.get(`/data/Books/${id}`)
    return res.data
  }
}

// ----------------------
// Interactions (Feedback, HiddenItems)
// ----------------------
export const interactions = {
  async rate({ book_id, rating, comment = '' }) {
    const user_id = await currentUserId();
    if (!user_id) throw new Error('Not authenticated (no user id)');
    const created_at = new Date().toISOString();

    const body = {
      book_id: String(book_id),
      user_id,
      rating: Number(rating),
      comment,
      created_at
    };

    const res = await rest.post('/data/Feedback', body);
    // Try to recompute aggregates (non-blocking; log errors only)
    try {
      await services.recomputeAggregates();
    } catch (e) {
      console.warn('recomputeAggregates failed (non-fatal):', e);
    }
    return res.data;
  },

  async hide({ book_id }) {
    const user_id = await currentUserId();
    if (!user_id) throw new Error('Not authenticated (no user id)');
    const created_at = new Date().toISOString();

    const body = {
      book_id: String(book_id),
      user_id,
      created_at
    };

    const res = await rest.post('/data/HiddenItems', body);
    return res.data;
  }
};


// ----------------------
// Profile (update current user)
// ----------------------
export const profile = {
  /**
   * Update current user's profile fields by objectId.
   * This implementation:
   *  - tries auth.me() to obtain objectId
   *  - fallback: tries to find user by email stored in localStorage
   */
  async update(payload = {}) {
    const token = getToken()
    if (!token) throw new Error('Not authenticated (no token)')

    // 1) Try auth.me() to get the full user row (preferred)
    let user = null
    try {
      user = await auth.me()
    } catch (e) {
      console.warn('auth.me() threw:', e)
      user = null
    }

    // Helper to extract objectId candidates
    const extractObjectId = (u) => {
      return u?.objectId || u?.id || u?.user?.objectId || u?.userId || u?.user?.id || null
    }

    let objectId = extractObjectId(user)

    // 2) Fallback: if no objectId, try to find user by email stored in localStorage
    if (!objectId) {
      try {
        const email = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('userEmail') : null
        if (email) {
          const where = `email='${String(email).replace(/'/g, "\\'")}'`
          const res = await rest.get(`/data/Users?where=${encodeURIComponent(where)}&pageSize=1`)
          const rows = res.data
          if (Array.isArray(rows) && rows.length > 0) {
            const found = rows[0]
            objectId = extractObjectId(found) || found?.objectId || found?.objectID || null
            console.log('profile.update: found user by email, objectId=', objectId)
          } else {
            console.warn('profile.update: user lookup by email returned no rows', email)
          }
        } else {
          console.warn('profile.update: no userEmail in localStorage to fallback on')
        }
      } catch (err) {
        console.warn('profile.update: error while searching user by email', err)
      }
    }

    if (!objectId) {
      throw new Error('Could not determine current user id; aborting profile update')
    }

    // Build update body with only defined fields
    const body = {}
    if (payload.preferred_genres !== undefined) body.preferred_genres = payload.preferred_genres
    if (payload.preferred_formats !== undefined) body.preferred_formats = payload.preferred_formats
    if (payload.language_pref !== undefined) body.language_pref = payload.language_pref
    if (payload.onboarding_done !== undefined) body.onboarding_done = Boolean(payload.onboarding_done)
    if (payload.onboarding_done !== undefined) body.onboarding_done = payload.onboarding_done

    try {
      const res = await rest.put(`/data/Users/${objectId}`, body)
      return res.data
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Profile update failed'
      const status = err?.response?.status
      throw new Error(`Profile update error${status ? ' (' + status + ')' : ''}: ${msg}`)
    }
  },

  async get() {
    try {
      return await auth.me()
    } catch {
      return null
    }
  }
}

// ----------------------
// Backendless server-side services
// ----------------------
export const services = {
  async getSuggestions(limit = SUGGESTIONS_LIMIT) {
    if (!SUBDOMAIN) throw new Error('Missing Backendless subdomain (VITE_BL_SUBDOMAIN)')
    const url = `https://${SUBDOMAIN}/api/services/SuggestionsService/Suggestions?limit=${limit}`
    const res = await axios.get(url, { headers: { 'user-token': getToken() } })
    return res.data
  },

  async recomputeAggregates() {
    if (!SUBDOMAIN) throw new Error('Missing Backendless subdomain (VITE_BL_SUBDOMAIN)')
    const url = `https://${SUBDOMAIN}/api/services/AggregatesService/recomputeUserAggregates`
    const res = await axios.post(url, {}, { headers: { 'user-token': getToken() } })
    return res.data
  }
}
