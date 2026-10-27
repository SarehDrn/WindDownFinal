// Integration tests: the whole App across screens, with fetch mocked by a
// small in-memory fake of the Wind Down API.
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App.jsx'
import { mockFetch } from '../test/mockFetch.js'

const EMAIL = 'flow@example.com'
const PASSWORD = 'sleepy-Owl-2024'

function fakeApi() {
  const state = { users: {}, tokens: {}, sessions: [], nextId: 1 }
  const authed = (headers) => state.tokens[(headers.Authorization || '').replace('Token ', '')]
  const unauthorized = [401, { detail: 'Authentication credentials were not provided.' }]

  const routes = {
    'GET /api/health/': () => [200, { status: 'ok' }],
    'POST /api/auth/register/': ({ body }) => {
      if (state.users[body.email]) return [400, { email: ['An account with this email already exists.'] }]
      state.users[body.email] = body.password
      const token = `tok-${body.email}`
      state.tokens[token] = body.email
      return [201, { token, email: body.email }]
    },
    'POST /api/auth/login/': ({ body }) => {
      if (state.users[body.email] !== body.password) {
        return [400, { non_field_errors: ['Invalid email or password.'] }]
      }
      const token = `tok-${body.email}`
      state.tokens[token] = body.email
      return [200, { token, email: body.email }]
    },
    'POST /api/auth/logout/': ({ headers }) => {
      const token = (headers.Authorization || '').replace('Token ', '')
      if (!state.tokens[token]) return unauthorized
      delete state.tokens[token]
      return [204, undefined]
    },
    'GET /api/sleep/': ({ headers }) => {
      const user = authed(headers)
      if (!user) return unauthorized
      return [200, state.sessions.filter((s) => s.user === user).map(({ user: _u, ...s }) => s)]
    },
    'POST /api/sleep/': ({ body, headers }) => {
      const user = authed(headers)
      if (!user) return unauthorized
      if (new Date(body.end_time) <= new Date(body.start_time)) {
        return [400, { end_time: ['Wake-up time must be after bedtime.'] }]
      }
      const session = {
        id: state.nextId++,
        user,
        ...body,
        source: 'manual',
        duration_minutes: (new Date(body.end_time) - new Date(body.start_time)) / 60000,
      }
      state.sessions.push(session)
      return [201, session]
    },
    'GET /api/recommendation/': ({ headers, url }) => {
      const user = authed(headers)
      if (!user) return unauthorized
      const wake = new URL(url, 'http://test').searchParams.get('wake')
      return [
        200,
        {
          wake,
          bedtime: '23:15',
          previous_day: true,
          cycles: 5,
          cycle_length_minutes: 90,
          minutes_to_fall_asleep: 15,
          sleep_minutes: 450,
          reason: '5 cycles of 90 min + 15 min to fall asleep',
          mode: 'population',
          uses_population_averages: true,
          nights_logged: state.sessions.filter((s) => s.user === user).length,
          message: 'Based on population averages (90-min cycles, 15 min to fall asleep).',
        },
      ]
    },
  }
  return { state, routes }
}

async function logIn() {
  await userEvent.type(screen.getByLabelText('Email'), EMAIL)
  await userEvent.type(screen.getByLabelText('Password'), PASSWORD)
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
  await screen.findByText(`Signed in as ${EMAIL}`)
}

describe('App (integration)', () => {
  let api
  let fetchMock

  beforeEach(() => {
    api = fakeApi()
    fetchMock = mockFetch(api.routes)
  })

  it('signs up, logs out, and logs back in', async () => {
    render(<App />)
    expect(await screen.findByText('API: ok')).toBeInTheDocument()

    // Sign up.
    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    await userEvent.type(screen.getByLabelText('Email'), EMAIL)
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(await screen.findByText(`Signed in as ${EMAIL}`)).toBeInTheDocument()

    // Log out returns to the login screen and the token is revoked.
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(Object.keys(api.state.tokens)).toHaveLength(0)
    expect(localStorage.getItem('winddown.auth')).toBeNull()

    // Wrong password shows an error; the right one logs in.
    await userEvent.type(screen.getByLabelText('Email'), EMAIL)
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')

    await userEvent.clear(screen.getByLabelText('Password'))
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText(`Signed in as ${EMAIL}`)).toBeInTheDocument()
  })

  it('logs a night, rejects invalid times, and gets a recommendation', async () => {
    api.state.users[EMAIL] = PASSWORD
    render(<App />)
    await logIn()

    // Sleep log: invalid times show an error and nothing is sent.
    await userEvent.click(screen.getByRole('button', { name: 'Sleep log' }))
    await screen.findByText('No sleep logged yet.')
    fireEvent.change(screen.getByLabelText('Bedtime'), { target: { value: '2026-10-02T07:00' } })
    fireEvent.change(screen.getByLabelText('Wake-up time'), { target: { value: '2026-10-01T23:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Add session' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Wake-up time must be after bedtime.')
    expect(fetchMock.mock.calls.some(([u, o]) => u === '/api/sleep/' && o.method === 'POST')).toBe(false)

    // Valid times are saved and listed.
    fireEvent.change(screen.getByLabelText('Bedtime'), { target: { value: '2026-10-01T23:00' } })
    fireEvent.change(screen.getByLabelText('Wake-up time'), { target: { value: '2026-10-02T07:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Add session' }))
    const list = await screen.findByRole('list', { name: 'Sleep sessions' })
    expect(within(list).getByText('8h 00m')).toBeInTheDocument()
    expect(api.state.sessions).toHaveLength(1)

    // Recommendation shows bedtime, reason and the population-averages note.
    await userEvent.click(screen.getByRole('button', { name: 'Bedtime' }))
    await userEvent.click(screen.getByRole('button', { name: 'Get bedtime' }))
    const rec = await screen.findByTestId('recommendation')
    expect(within(rec).getByText('23:15')).toBeInTheDocument()
    expect(within(rec).getByText('5 cycles of 90 min + 15 min to fall asleep')).toBeInTheDocument()
    expect(within(rec).getByText(/Based on population averages/)).toBeInTheDocument()
  })

  it('remembers the session across reloads', async () => {
    api.state.users[EMAIL] = PASSWORD
    const { unmount } = render(<App />)
    await logIn()
    unmount()

    render(<App />)
    expect(screen.getByText(`Signed in as ${EMAIL}`)).toBeInTheDocument()
  })
})
