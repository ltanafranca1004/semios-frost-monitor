import { addDays, type Field, type Reading, type Station } from '../api/mockApi'
import { getWindowDates, getWindowStart } from './dates'

// "Last 7 days" from the brief, ending on (and including) the as-of date
export const RECENT_DAYS = 7

// Trend compares the last 7 days with the 7 before, so we need 14 days of data
export const TREND_DAYS = 14

// A daily low at or below this is frost risk (the brief says "0 °C or below")
export const FROST_THRESHOLD_C = 0

// Weekly averages closer than this count as "steady", so small noise isn't called a trend
export const TREND_THRESHOLD_C = 0.5

export type FrostStatus = 'at-risk' | 'no-risk' | 'no-data'
export type Trend = 'colder' | 'warmer' | 'steady' | 'no-data'

export type DailyLow = { date: string; lowTempC: number | null }

export type StationSummary = {
  station: Station
  dailyLows: DailyLow[] // one entry per day in the recent window, oldest first
  coldestLowC: number | null
  isOffline: boolean
  trend: Trend
}

export type FieldSummary = {
  field: Field
  coldestLowC: number | null
  frostStatus: FrostStatus
  trend: Trend
  stationCount: number
  offlineCount: number
}

// Keeps readings whose date is in the `days`-long window ending on endDate (inclusive)
export function getReadingsInWindow(readings: Reading[], endDate: string, days: number): Reading[] {
  const startDate = getWindowStart(endDate, days)
  // ISO dates (YYYY-MM-DD) sort correctly as plain strings
  return readings.filter((reading) => reading.date >= startDate && reading.date <= endDate)
}

// Returns only the temperatures that were actually reported.
// null means the station didn't report, so it is skipped, never treated as 0.
export function getReportedTemps(readings: Reading[]): number[] {
  const temps: number[] = []
  for (const reading of readings) {
    if (reading.lowTempC !== null) {
      temps.push(reading.lowTempC)
    }
  }
  return temps
}

export function getAverage(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }
  let total = 0
  for (const value of values) {
    total += value
  }
  return total / values.length
}

// Coldest reported low in the last 7 days, or null if nothing was reported
export function getColdestLow(readings: Reading[], asOfDate: string): number | null {
  const recentTemps = getReportedTemps(getReadingsInWindow(readings, asOfDate, RECENT_DAYS))
  if (recentTemps.length === 0) {
    return null
  }
  return Math.min(...recentTemps)
}

export function getFrostStatus(coldestLowC: number | null): FrostStatus {
  if (coldestLowC === null) {
    return 'no-data'
  }
  if (coldestLowC <= FROST_THRESHOLD_C) {
    return 'at-risk'
  }
  return 'no-risk'
}

// Offline = no reported low on the as-of date AND none on the day before.
// One missed day alone doesn't count (every station missed Jan 12 in the mock data).
export function isStationOffline(stationReadings: Reading[], asOfDate: string): boolean {
  const dayBefore = addDays(asOfDate, -1)
  for (const reading of stationReadings) {
    const isLastTwoDays = reading.date === asOfDate || reading.date === dayBefore
    if (isLastTwoDays && reading.lowTempC !== null) {
      return false
    }
  }
  return true
}

// Compares the average low of the last 7 days with the average of the 7 days before
export function getTrend(readings: Reading[], asOfDate: string): Trend {
  const previousWeekEnd = addDays(asOfDate, -RECENT_DAYS)
  const recentAverage = getAverage(getReportedTemps(getReadingsInWindow(readings, asOfDate, RECENT_DAYS)))
  const previousAverage = getAverage(
    getReportedTemps(getReadingsInWindow(readings, previousWeekEnd, RECENT_DAYS)),
  )

  if (recentAverage === null || previousAverage === null) {
    return 'no-data'
  }

  const change = recentAverage - previousAverage
  if (change <= -TREND_THRESHOLD_C) {
    return 'colder'
  }
  if (change >= TREND_THRESHOLD_C) {
    return 'warmer'
  }
  return 'steady'
}

// One entry per day in the recent window. A missing row and a null both become null.
export function getDailyLows(stationReadings: Reading[], asOfDate: string): DailyLow[] {
  return getWindowDates(asOfDate, RECENT_DAYS).map((date) => {
    const reading = stationReadings.find((r) => r.date === date)
    return { date, lowTempC: reading ? reading.lowTempC : null }
  })
}

export function summarizeStation(station: Station, readings: Reading[], asOfDate: string): StationSummary {
  const stationReadings = readings.filter((reading) => reading.stationId === station.id)
  return {
    station,
    dailyLows: getDailyLows(stationReadings, asOfDate),
    coldestLowC: getColdestLow(stationReadings, asOfDate),
    isOffline: isStationOffline(stationReadings, asOfDate),
    trend: getTrend(stationReadings, asOfDate),
  }
}

export function summarizeField(
  field: Field,
  stations: Station[],
  readings: Reading[],
  asOfDate: string,
): FieldSummary {
  const fieldStations = stations.filter((station) => station.fieldId === field.id)
  const fieldStationIds = fieldStations.map((station) => station.id)
  const fieldReadings = readings.filter((reading) => fieldStationIds.includes(reading.stationId))

  let offlineCount = 0
  for (const station of fieldStations) {
    const stationReadings = fieldReadings.filter((reading) => reading.stationId === station.id)
    if (isStationOffline(stationReadings, asOfDate)) {
      offlineCount++
    }
  }

  const coldestLowC = getColdestLow(fieldReadings, asOfDate)
  return {
    field,
    coldestLowC,
    frostStatus: getFrostStatus(coldestLowC),
    trend: getTrend(fieldReadings, asOfDate),
    stationCount: fieldStations.length,
    offlineCount,
  }
}

const STATUS_ORDER: Record<FrostStatus, number> = { 'at-risk': 0, 'no-risk': 1, 'no-data': 2 }

// At-risk fields first, then no-risk, then no-data. Within a group, coldest first.
export function sortFieldsByRisk(summaries: FieldSummary[]): FieldSummary[] {
  return [...summaries].sort((a, b) => {
    const statusDifference = STATUS_ORDER[a.frostStatus] - STATUS_ORDER[b.frostStatus]
    if (statusDifference !== 0) {
      return statusDifference
    }
    // Both null only happens in the no-data group, where order doesn't matter
    return (a.coldestLowC ?? 0) - (b.coldestLowC ?? 0)
  })
}

export function summarizeFields(
  fields: Field[],
  stations: Station[],
  readings: Reading[],
  asOfDate: string,
): FieldSummary[] {
  const summaries = fields.map((field) => summarizeField(field, stations, readings, asOfDate))
  return sortFieldsByRisk(summaries)
}
