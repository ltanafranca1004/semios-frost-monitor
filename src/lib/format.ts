// Shows a temperature for the UI. null means nothing was reported.
export function formatTemp(tempC: number | null): string {
  if (tempC === null) {
    return 'No data'
  }
  return `${tempC} °C`
}
