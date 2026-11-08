import { useEffect, useState } from 'react'
import {
  AS_OF_DATE,
  getFields,
  getReadings,
  getStations,
  type Reading,
  type Station,
} from '../api/mockApi'
import { getWindowStart } from '../lib/dates'
import { summarizeFields, TREND_DAYS, type FieldSummary } from '../lib/frost'

export type FrostData = {
  fieldSummaries: FieldSummary[] // already sorted, at-risk first
  stations: Station[]
  readings: Reading[] // last 14 days, kept so the detail view needs no extra fetch
}

// Only one of these can be true at a time, so the UI can't read data while loading
export type FrostDataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: FrostData }

export function useFrostData() {
  const [state, setState] = useState<FrostDataState>({ status: 'loading' })

  async function loadData() {
    try {
      // Fields and stations don't depend on each other, so fetch them at the same time
      const [fields, stations] = await Promise.all([getFields(), getStations()])
      const stationIds = stations.map((station) => station.id)
      const readings = await getReadings(stationIds, getWindowStart(AS_OF_DATE, TREND_DAYS), AS_OF_DATE)

      const fieldSummaries = summarizeFields(fields, stations, readings, AS_OF_DATE)
      setState({ status: 'success', data: { fieldSummaries, stations, readings } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setState({ status: 'error', message })
    }
  }

  // State starts as 'loading', so the first load doesn't need to set it
  useEffect(() => {
    // loadData catches its own errors, so this promise never rejects.
    // The lint rule can't see that loadData only sets state after an await (not synchronously).
    // oxlint-disable-next-line react/set-state-in-effect
    loadData()
  }, [])

  function retry() {
    setState({ status: 'loading' })
    loadData()
  }

  return { state, retry }
}
