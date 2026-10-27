import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api.js'
import SleepForm from './SleepForm.jsx'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(minutes) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export default function SleepSessions({ token }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  const load = useCallback(async () => {
    try {
      setSessions(await apiFetch('/api/sleep/', { token }))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(payload) {
    await apiFetch('/api/sleep/', { method: 'POST', body: payload, token })
    await load()
  }

  async function handleUpdate(id, payload) {
    await apiFetch(`/api/sleep/${id}/`, { method: 'PUT', body: payload, token })
    setEditingId(null)
    await load()
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/sleep/${id}/`, { method: 'DELETE', token })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <div className="card">
        <h2>Log sleep</h2>
        <SleepForm onSubmit={handleCreate} />
      </div>

      <div className="card">
        <h2>Your sessions</h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="muted">No sleep logged yet.</p>
        ) : (
          <ul className="sessions" aria-label="Sleep sessions">
            {sessions.map((s) => (
              <li key={s.id}>
                {editingId === s.id ? (
                  <SleepForm
                    initial={s}
                    submitLabel="Save"
                    onSubmit={(payload) => handleUpdate(s.id, payload)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <span>
                      {formatDateTime(s.start_time)} → {formatDateTime(s.end_time)}
                      <br />
                      <span className="muted">{formatDuration(s.duration_minutes)}</span>
                    </span>
                    <span className="row">
                      <button type="button" className="secondary" onClick={() => setEditingId(s.id)}>
                        Edit
                      </button>
                      <button type="button" className="secondary" onClick={() => handleDelete(s.id)}>
                        Delete
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
