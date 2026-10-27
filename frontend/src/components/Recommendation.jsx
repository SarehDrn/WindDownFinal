import { useState } from 'react'
import { apiFetch } from '../api.js'

export default function Recommendation({ token }) {
  const [wake, setWake] = useState('07:00')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!wake) {
      setError('Enter a wake-up time.')
      return
    }
    setBusy(true)
    try {
      const data = await apiFetch(`/api/recommendation/?wake=${encodeURIComponent(wake)}`, {
        token,
      })
      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2>When should I go to bed?</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          I need to wake up at
          <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          Get bedtime
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div aria-live="polite" data-testid="recommendation">
          <p className="muted">Go to bed at</p>
          <p className="bedtime">{result.bedtime}</p>
          <p>{result.reason}</p>
          {result.uses_population_averages && <p className="muted">{result.message}</p>}
        </div>
      )}
    </section>
  )
}
