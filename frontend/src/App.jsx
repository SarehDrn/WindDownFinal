import { useState } from 'react'
import { apiFetch } from './api.js'
import AuthForm from './components/AuthForm.jsx'
import HealthStatus from './components/HealthStatus.jsx'
import Recommendation from './components/Recommendation.jsx'
import SleepSessions from './components/SleepSessions.jsx'

const STORAGE_KEY = 'winddown.auth'

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export default function App() {
  const [auth, setAuth] = useState(loadAuth)
  const [tab, setTab] = useState('bedtime')

  function handleAuth(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setAuth(next)
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout/', { method: 'POST', token: auth.token })
    } catch {
      // Even if the server call fails, forget the token locally.
    }
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wind Down</h1>
        <HealthStatus />
      </header>

      {!auth ? (
        <AuthForm onAuth={handleAuth} />
      ) : (
        <main>
          <div className="row">
            <p className="muted">Signed in as {auth.email}</p>
            <button type="button" className="secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
          <nav className="tabs" aria-label="Sections">
            <button
              type="button"
              className="secondary"
              aria-pressed={tab === 'bedtime'}
              onClick={() => setTab('bedtime')}
            >
              Bedtime
            </button>
            <button
              type="button"
              className="secondary"
              aria-pressed={tab === 'sleep'}
              onClick={() => setTab('sleep')}
            >
              Sleep log
            </button>
          </nav>
          {tab === 'bedtime' ? (
            <Recommendation token={auth.token} />
          ) : (
            <SleepSessions token={auth.token} />
          )}
        </main>
      )}
    </div>
  )
}
