// Shows a temperature for the UI. null means nothing was reported.
export function formatTemp(tempC: number | null): string {
  if (tempC === null) {
    return 'No data'
  }
  return `${tempC} °C`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// '2027-01-09' -> 'Jan 9'. Reads the parts of the string directly, so the
// user's time zone can't shift the date by a day.
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`
}
