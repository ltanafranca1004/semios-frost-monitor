import { addDays } from '../api/mockApi'

// Returns the `days` ISO dates that end on `endDate` (inclusive), oldest first.
// Example: getWindowDates('2027-01-15', 7) -> ['2027-01-09', ..., '2027-01-15']
export function getWindowDates(endDate: string, days: number): string[] {
  const dates: string[] = []
  for (let daysAgo = days - 1; daysAgo >= 0; daysAgo--) {
    dates.push(addDays(endDate, -daysAgo))
  }
  return dates
}

// Returns the first date of a `days`-long window ending on `endDate`.
// Example: getWindowStart('2027-01-15', 7) -> '2027-01-09'
export function getWindowStart(endDate: string, days: number): string {
  return addDays(endDate, -(days - 1))
}
