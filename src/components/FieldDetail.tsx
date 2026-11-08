import { AS_OF_DATE, type Reading, type Station } from '../api/mockApi'
import { getWindowDates } from '../lib/dates'
import { RECENT_DAYS, sortStationsByColdest, summarizeStation, type FieldSummary } from '../lib/frost'
import { formatShortDate, formatTemp } from '../lib/format'
import { TrendLabel } from './TrendLabel'

type FieldDetailProps = {
  fieldSummary: FieldSummary
  stations: Station[] // all stations; this component picks the ones in the field
  readings: Reading[]
}

export function FieldDetail({ fieldSummary, stations, readings }: FieldDetailProps) {
  const { field } = fieldSummary
  const fieldStations = stations.filter((station) => station.fieldId === field.id)
  const stationSummaries = sortStationsByColdest(
    fieldStations.map((station) => summarizeStation(station, readings, AS_OF_DATE)),
  )
  const windowDates = getWindowDates(AS_OF_DATE, RECENT_DAYS)

  return (
    <section aria-labelledby="field-detail-heading">
      <h2 id="field-detail-heading">
        {field.name} ({field.crop}): stations
      </h2>

      {stationSummaries.length === 0 ? (
        <p>No stations found for this field.</p>
      ) : (
        <table>
          <caption>Daily lows for the last 7 days (°C), coldest station first</caption>
          <thead>
            <tr>
              <th scope="col">Station</th>
              {windowDates.map((date) => (
                <th scope="col" key={date}>
                  {formatShortDate(date)}
                </th>
              ))}
              <th scope="col">Coldest</th>
              <th scope="col">Trend vs previous week</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {stationSummaries.map((summary) => (
              <tr key={summary.station.id} className={summary.isOffline ? 'row-offline' : undefined}>
                <th scope="row">{summary.station.label}</th>
                {summary.dailyLows.map((dailyLow) => (
                  <td key={dailyLow.date}>
                    {dailyLow.lowTempC === null ? (
                      <>
                        <span aria-hidden="true">–</span>
                        <span className="visually-hidden">No reading</span>
                      </>
                    ) : (
                      dailyLow.lowTempC
                    )}
                  </td>
                ))}
                <td>{formatTemp(summary.coldestLowC)}</td>
                <td>
                  <TrendLabel trend={summary.trend} />
                </td>
                <td>
                  {summary.isOffline ? (
                    <span className="badge badge-offline">
                      <span aria-hidden="true">⚠</span> Offline
                    </span>
                  ) : (
                    'Reporting'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
