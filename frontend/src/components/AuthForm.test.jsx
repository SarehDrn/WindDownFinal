import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AuthForm from './AuthForm.jsx'
import { mockFetch } from '../test/mockFetch.js'

describe('AuthForm', () => {
  it('logs in and passes the token up', async () => {
    const fetchMock = mockFetch({
      'POST /api/auth/login/': ({ body }) => [200, { token: 'tok-1', email: body.email }],
    })
    const onAuth = vi.fn()
    render(<AuthForm onAuth={onAuth} />)

    await userEvent.type(screen.getByLabelText('Email'), 'dana@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'sleepy-Owl-2024')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(onAuth).toHaveBeenCalledWith({ token: 'tok-1', email: 'dana@example.com' })
    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({
      email: 'dana@example.com',
      password: 'sleepy-Owl-2024',
    })
  })

  it('signs up via the register endpoint after switching mode', async () => {
    const fetchMock = mockFetch({
      'POST /api/auth/register/': ({ body }) => [201, { token: 'tok-2', email: body.email }],
    })
    const onAuth = vi.fn()
    render(<AuthForm onAuth={onAuth} />)

    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    await userEvent.type(screen.getByLabelText('Email'), 'eve@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'sleepy-Owl-2024')
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/register/')
    expect(onAuth).toHaveBeenCalledWith({ token: 'tok-2', email: 'eve@example.com' })
  })

  it('shows the server error on bad credentials', async () => {
    mockFetch({
      'POST /api/auth/login/': () => [400, { non_field_errors: ['Invalid email or password.'] }],
    })
    const onAuth = vi.fn()
    render(<AuthForm onAuth={onAuth} />)

    await userEvent.type(screen.getByLabelText('Email'), 'dana@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')
    expect(onAuth).not.toHaveBeenCalled()
  })
})
