import type { FieldSummary } from '../lib/frost'
import { formatTemp } from '../lib/format'
import { FrostBadge } from './FrostBadge'
import { TrendLabel } from './TrendLabel'

// Expects summaries already sorted at-risk first (summarizeFields does this)
export function FieldTable({ summaries }: { summaries: FieldSummary[] }) {
  if (summaries.length === 0) {
    return <p>No fields found for this farm.</p>
  }

  return (
    <table>
      <caption>Fields, with frost risk at the top</caption>
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
        {summaries.map((summary) => (
          <tr key={summary.field.id} className={`row-${summary.frostStatus}`}>
            <th scope="row">{summary.field.name}</th>
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
        ))}
      </tbody>
    </table>
  )
}
