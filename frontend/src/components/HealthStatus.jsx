import { useEffect, useState } from 'react'
import { apiFetch } from '../api.js'

export default function HealthStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true
    apiFetch('/api/health/')
      .then((data) => active && setStatus(data?.status === 'ok' ? 'ok' : 'error'))
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [])

  const label = {
    checking: 'Checking API…',
    ok: 'API: ok',
    error: 'API: unavailable',
  }[status]

  return (
    <p className={`health health-${status}`} role="status">
      {label}
    </p>
  )
}
