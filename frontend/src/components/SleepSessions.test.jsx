import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import SleepSessions from './SleepSessions.jsx'
import { mockFetch } from '../test/mockFetch.js'

function session(id, start, end) {
  const s = new Date(start)
  const e = new Date(end)
  return {
    id,
    start_time: s.toISOString(),
    end_time: e.toISOString(),
    minutes_to_fall_asleep: null,
    source: 'manual',
    duration_minutes: (e - s) / 60000,
  }
}

describe('SleepSessions', () => {
  it('lists sessions with duration and sends the token', async () => {
    const fetchMock = mockFetch({
      'GET /api/sleep/': () => [200, [session(1, '2026-10-01T23:00', '2026-10-02T06:30')]],
    })
    render(<SleepSessions token="tok" />)
    const list = await screen.findByRole('list', { name: 'Sleep sessions' })
    expect(within(list).getByText('7h 30m')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Token tok')
  })

  it('shows an empty state', async () => {
    mockFetch({ 'GET /api/sleep/': () => [200, []] })
    render(<SleepSessions token="tok" />)
    expect(await screen.findByText('No sleep logged yet.')).toBeInTheDocument()
  })

  it('deletes a session', async () => {
    let sessions = [session(1, '2026-10-01T23:00', '2026-10-02T07:00')]
    const fetchMock = mockFetch({
      'GET /api/sleep/': () => [200, sessions],
      'DELETE /api/sleep/1/': () => {
        sessions = []
        return [204, undefined]
      },
    })
    render(<SleepSessions token="tok" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('No sleep logged yet.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/sleep/1/', expect.objectContaining({ method: 'DELETE' }))
  })

  it('edits a session with PUT', async () => {
    let sessions = [session(1, '2026-10-01T23:00', '2026-10-02T07:00')]
    const fetchMock = mockFetch({
      'GET /api/sleep/': () => [200, sessions],
      'PUT /api/sleep/1/': ({ body }) => {
        sessions = [{ ...sessions[0], ...body, duration_minutes: 450 }]
        return [200, sessions[0]]
      },
    })
    render(<SleepSessions token="tok" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    const list = screen.getByRole('list', { name: 'Sleep sessions' })
    fireEvent.change(within(list).getByLabelText('Wake-up time'), {
      target: { value: '2026-10-02T06:30' },
    })
    await userEvent.click(within(list).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('7h 30m')).toBeInTheDocument()
    const putCall = fetchMock.mock.calls.find(([, o]) => o.method === 'PUT')
    expect(JSON.parse(putCall[1].body).end_time).toBe(new Date('2026-10-02T06:30').toISOString())
  })

  it('shows the server validation error when creating fails', async () => {
    mockFetch({
      'GET /api/sleep/': () => [200, []],
      'POST /api/sleep/': () => [400, { end_time: ['Wake-up time must be after bedtime.'] }],
    })
    render(<SleepSessions token="tok" />)
    await screen.findByText('No sleep logged yet.')
    fireEvent.change(screen.getByLabelText('Bedtime'), { target: { value: '2026-10-01T23:00' } })
    fireEvent.change(screen.getByLabelText('Wake-up time'), { target: { value: '2026-10-02T07:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Add session' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wake-up time must be after bedtime.')
  })
})
