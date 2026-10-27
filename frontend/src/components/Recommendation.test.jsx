import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Recommendation from './Recommendation.jsx'
import { mockFetch } from '../test/mockFetch.js'

const RESPONSE = {
  wake: '06:30',
  bedtime: '22:45',
  previous_day: true,
  cycles: 5,
  cycle_length_minutes: 90,
  minutes_to_fall_asleep: 15,
  sleep_minutes: 450,
  reason: '5 cycles of 90 min + 15 min to fall asleep',
  mode: 'population',
  uses_population_averages: true,
  nights_logged: 0,
  message: 'Based on population averages (90-min cycles, 15 min to fall asleep).',
}

describe('Recommendation', () => {
  it('requests a bedtime for the chosen wake time and shows bedtime, reason and note', async () => {
    const fetchMock = mockFetch({ 'GET /api/recommendation/': () => [200, RESPONSE] })
    render(<Recommendation token="tok" />)

    fireEvent.change(screen.getByLabelText('I need to wake up at'), { target: { value: '06:30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Get bedtime' }))

    expect(await screen.findByText('22:45')).toBeInTheDocument()
    expect(screen.getByText('5 cycles of 90 min + 15 min to fall asleep')).toBeInTheDocument()
    expect(screen.getByText(/Based on population averages/)).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/recommendation/?wake=06%3A30')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Token tok')
  })

  it('shows the server error', async () => {
    mockFetch({
      'GET /api/recommendation/': () => [400, { wake: ['Time has wrong format.'] }],
    })
    render(<Recommendation token="tok" />)
    await userEvent.click(screen.getByRole('button', { name: 'Get bedtime' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Time has wrong format.')
  })

  it('requires a wake time', async () => {
    const fetchMock = mockFetch({})
    render(<Recommendation token="tok" />)
    fireEvent.change(screen.getByLabelText('I need to wake up at'), { target: { value: '' } })
    await userEvent.click(screen.getByRole('button', { name: 'Get bedtime' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a wake-up time.')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
