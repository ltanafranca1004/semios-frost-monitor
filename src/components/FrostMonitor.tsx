import { AS_OF_DATE } from '../api/mockApi'
import { useFrostData } from '../hooks/useFrostData'
import { ErrorState } from './ErrorState'
import { FieldTable } from './FieldTable'

export function FrostMonitor() {
  const { state, retry } = useFrostData()

  return (
    <main>
      <h1>Frost Monitor</h1>
      <p>
        Data as of {AS_OF_DATE}. A field is at frost risk if any station recorded a low of 0 °C or
        below in the last 7 days.
      </p>

      {state.status === 'loading' && (
        // role="status" announces the loading message without interrupting the user
        <p role="status">Loading frost data…</p>
      )}

      {state.status === 'error' && <ErrorState message={state.message} onRetry={retry} />}

      {state.status === 'success' && <FieldTable summaries={state.data.fieldSummaries} />}
    </main>
  )
}
