import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SleepForm, { fromLocalInput, toLocalInput, WAKE_BEFORE_BED_ERROR } from './SleepForm.jsx'

function fillTimes(start, end) {
  fireEvent.change(screen.getByLabelText('Bedtime'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('Wake-up time'), { target: { value: end } })
}

describe('SleepForm', () => {
  it('submits bedtime and wake-up time as ISO strings', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<SleepForm onSubmit={onSubmit} />)
    fillTimes('2026-10-01T23:00', '2026-10-02T07:00')
    await userEvent.type(screen.getByLabelText(/Minutes to fall asleep/), '12')
    await userEvent.click(screen.getByRole('button', { name: 'Add session' }))

    expect(onSubmit).toHaveBeenCalledWith({
      start_time: new Date('2026-10-01T23:00').toISOString(),
      end_time: new Date('2026-10-02T07:00').toISOString(),
      minutes_to_fall_asleep: 12,
    })
  })

  it('shows an error and does not submit when wake-up is before bedtime', async () => {
    const onSubmit = vi.fn()
    render(<SleepForm onSubmit={onSubmit} />)
    fillTimes('2026-10-02T07:00', '2026-10-01T23:00')
    await userEvent.click(screen.getByRole('button', { name: 'Add session' }))

    expect(screen.getByRole('alert')).toHaveTextContent(WAKE_BEFORE_BED_ERROR)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error when times are missing', async () => {
    const onSubmit = vi.fn()
    render(<SleepForm onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add session' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter both bedtime and wake-up time.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows the server error message when saving fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Wake-up time must be after bedtime.'))
    render(<SleepForm onSubmit={onSubmit} />)
    fillTimes('2026-10-01T23:00', '2026-10-02T07:00')
    await userEvent.click(screen.getByRole('button', { name: 'Add session' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wake-up time must be after bedtime.')
  })

  it('pre-fills values when editing', () => {
    const initial = {
      start_time: new Date('2026-10-01T22:15').toISOString(),
      end_time: new Date('2026-10-02T06:45').toISOString(),
      minutes_to_fall_asleep: 9,
    }
    render(<SleepForm initial={initial} onSubmit={vi.fn()} submitLabel="Save" />)
    expect(screen.getByLabelText('Bedtime')).toHaveValue('2026-10-01T22:15')
    expect(screen.getByLabelText('Wake-up time')).toHaveValue('2026-10-02T06:45')
    expect(screen.getByLabelText(/Minutes to fall asleep/)).toHaveValue(9)
  })

  it('round-trips local input values', () => {
    expect(toLocalInput(fromLocalInput('2026-03-05T04:07'))).toBe('2026-03-05T04:07')
  })
})
