import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HealthStatus from './HealthStatus.jsx'
import { mockFetch } from '../test/mockFetch.js'

describe('HealthStatus', () => {
  it('shows ok when the API is healthy', async () => {
    const fetchMock = mockFetch({ 'GET /api/health/': () => [200, { status: 'ok' }] })
    render(<HealthStatus />)
    expect(await screen.findByText('API: ok')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/health/', expect.any(Object))
  })

  it('shows unavailable when the API fails', async () => {
    mockFetch({ 'GET /api/health/': () => [500, { detail: 'boom' }] })
    render(<HealthStatus />)
    expect(await screen.findByText('API: unavailable')).toBeInTheDocument()
  })
})
