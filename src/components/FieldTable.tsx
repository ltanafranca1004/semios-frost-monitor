import type { FieldSummary } from '../lib/frost'
import { formatTemp } from '../lib/format'
import { FrostBadge } from './FrostBadge'
import { TrendLabel } from './TrendLabel'

type FieldTableProps = {
  summaries: FieldSummary[] // expected already sorted at-risk first (summarizeFields does this)
  selectedFieldId: string | null
  onSelectField: (fieldId: string) => void
}

export function FieldTable({ summaries, selectedFieldId, onSelectField }: FieldTableProps) {
  if (summaries.length === 0) {
    return <p>No fields found for this farm.</p>
  }

  return (
    <table>
      <caption>Fields, with frost risk at the top. Select a field to see its stations.</caption>
      <thead>
        <tr>
          <th scope="col">Field</th>
          <th scope="col">Crop</th>
          <th scope="col">Coldest low (last 7 days)</th>
          <th scope="col">Frost risk</th>
          <th scope="col">Trend vs previous week</th>
          <th scope="col">Stations offline</th>
        </tr>
      </thead>
      <tbody>
        {summaries.map((summary) => {
          const isSelected = summary.field.id === selectedFieldId
          return (
            <tr key={summary.field.id} className={`row-${summary.frostStatus}`}>
              <th scope="row">
                {/* A real button gives keyboard support (Tab, Enter, Space) for free.
                    aria-pressed tells screen readers which field is selected. */}
                <button
                  type="button"
                  className="field-button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectField(summary.field.id)}
                >
                  {summary.field.name}
                </button>
              </th>
              <td>{summary.field.crop}</td>
              <td>{formatTemp(summary.coldestLowC)}</td>
              <td>
                <FrostBadge status={summary.frostStatus} />
              </td>
              <td>
                <TrendLabel trend={summary.trend} />
              </td>
              <td>
                {summary.offlineCount} of {summary.stationCount}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
