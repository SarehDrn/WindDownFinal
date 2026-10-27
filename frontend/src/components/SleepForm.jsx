import { useState } from 'react'

const pad = (n) => String(n).padStart(2, '0')

// ISO string -> value for <input type="datetime-local"> in the user's local time.
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// datetime-local value (local time) -> ISO string in UTC for the API.
export function fromLocalInput(value) {
  return new Date(value).toISOString()
}

export const WAKE_BEFORE_BED_ERROR = 'Wake-up time must be after bedtime.'

// Add / edit form. onSubmit(payload) should throw an Error with a message on failure.
export default function SleepForm({ initial, onSubmit, onCancel, submitLabel = 'Add session' }) {
  const [start, setStart] = useState(toLocalInput(initial?.start_time))
  const [end, setEnd] = useState(toLocalInput(initial?.end_time))
  const [fallAsleep, setFallAsleep] = useState(
    initial?.minutes_to_fall_asleep == null ? '' : String(initial.minutes_to_fall_asleep),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!start || !end) {
      setError('Enter both bedtime and wake-up time.')
      return
    }
    if (new Date(end) <= new Date(start)) {
      setError(WAKE_BEFORE_BED_ERROR)
      return
    }
    const payload = {
      start_time: fromLocalInput(start),
      end_time: fromLocalInput(end),
      minutes_to_fall_asleep: fallAsleep === '' ? null : Number(fallAsleep),
    }
    setBusy(true)
    try {
      await onSubmit(payload)
      if (!initial) {
        setStart('')
        setEnd('')
        setFallAsleep('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        Bedtime
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label>
        Wake-up time
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>
      <label>
        Minutes to fall asleep (optional)
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={fallAsleep}
          onChange={(e) => setFallAsleep(e.target.value)}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        <button type="submit" disabled={busy}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
