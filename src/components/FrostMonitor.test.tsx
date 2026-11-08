import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getFields, getReadings, getStations, type Field, type Reading, type Station } from '../api/mockApi'
import { FrostMonitor } from './FrostMonitor'

// Replace the three API calls with mocks we control, so the test isn't slow or random.
// AS_OF_DATE and addDays stay real, so the date logic is the same as in the app.
vi.mock('../api/mockApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/mockApi')>()
  return { ...actual, getFields: vi.fn(), getStations: vi.fn(), getReadings: vi.fn() }
})

// The warm field comes first from the API, so the test proves the UI re-sorts at-risk to the top
const FIELDS: Field[] = [
  { id: 'field-1', name: 'Warm Field', crop: 'Apples' },
  { id: 'field-2', name: 'Cold Field', crop: 'Cherries' },
]

const STATIONS: Station[] = [
  { id: 'field-1-s1', fieldId: 'field-1', label: 'S-01' },
  { id: 'field-2-s1', fieldId: 'field-2', label: 'S-01' },
]

const READINGS: Reading[] = [
  { stationId: 'field-1-s1', date: '2027-01-15', lowTempC: 5 },
  { stationId: 'field-2-s1', date: '2027-01-14', lowTempC: -1 },
  { stationId: 'field-2-s1', date: '2027-01-15', lowTempC: null },
]

it('shows an error, retries from the keyboard, then lists the at-risk field first', async () => {
  vi.mocked(getFields)
    .mockRejectedValueOnce(new Error('Network request failed')) // first load fails
    .mockResolvedValue(FIELDS) // every load after that succeeds
  vi.mocked(getStations).mockResolvedValue(STATIONS)
  vi.mocked(getReadings).mockResolvedValue(READINGS)

  const user = userEvent.setup()
  render(<FrostMonitor />)

  // Loading message shows first, so the screen is never blank
  expect(screen.getByRole('status')).toHaveTextContent('Loading frost data')

  // The failed load shows an alert with a Retry button
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Network request failed')

  // Retry using only the keyboard: Tab to the button, then press Enter
  await user.tab()
  expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus()
  await user.keyboard('{Enter}')

  // The table appears with the at-risk field in the first row (row 0 is the header)
  const table = await screen.findByRole('table')
  const rows = within(table).getAllByRole('row')
  expect(rows[1]).toHaveTextContent('Cold Field')
  expect(rows[1]).toHaveTextContent('Frost risk')
  expect(rows[2]).toHaveTextContent('Warm Field')
  expect(rows[2]).toHaveTextContent('No risk')

  // The indicator is visible text, not just a colour.
  // Scoped to the row because the column header also says "Frost risk".
  expect(within(rows[1]).getByText('Frost risk')).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
