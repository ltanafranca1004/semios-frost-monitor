import { useState } from 'react'
import { AS_OF_DATE } from '../api/mockApi'
import { useFrostData } from '../hooks/useFrostData'
import type { FieldSummary } from '../lib/frost'
import { ErrorState } from './ErrorState'
import { FieldDetail } from './FieldDetail'
import { FieldTable } from './FieldTable'

export function FrostMonitor() {
  const { state, retry } = useFrostData()
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  // Clicking the selected field again closes its detail
  function handleSelectField(fieldId: string) {
    if (fieldId === selectedFieldId) {
      setSelectedFieldId(null)
    } else {
      setSelectedFieldId(fieldId)
    }
  }

  let selectedSummary: FieldSummary | undefined
  if (state.status === 'success') {
    selectedSummary = state.data.fieldSummaries.find((summary) => summary.field.id === selectedFieldId)
  }

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

      {state.status === 'success' && (
        <>
          <FieldTable
            summaries={state.data.fieldSummaries}
            selectedFieldId={selectedFieldId}
            onSelectField={handleSelectField}
          />
          {selectedSummary && (
            <FieldDetail
              fieldSummary={selectedSummary}
              stations={state.data.stations}
              readings={state.data.readings}
            />
          )}
        </>
      )}
    </main>
  )
}
