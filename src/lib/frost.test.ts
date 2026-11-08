import type { Reading } from '../api/mockApi'
import { getColdestLow, getFrostStatus, isStationOffline } from './frost'

// Fixed "today" so the tests never depend on the computer's clock
const AS_OF = '2027-01-15'

function reading(date: string, lowTempC: number | null): Reading {
  return { stationId: 'station-1', date, lowTempC }
}

describe('frost risk', () => {
  it('counts exactly 0 °C as frost risk', () => {
    const coldest = getColdestLow([reading('2027-01-15', 0), reading('2027-01-14', 3)], AS_OF)
    expect(coldest).toBe(0)
    expect(getFrostStatus(coldest)).toBe('at-risk')
  })

  it('ignores null readings instead of treating them as 0', () => {
    const readings = [reading('2027-01-13', 4), reading('2027-01-12', null), reading('2027-01-11', 2)]
    const coldest = getColdestLow(readings, AS_OF)
    expect(coldest).toBe(2)
    expect(getFrostStatus(coldest)).toBe('no-risk')
  })

  it('only looks at Jan 9 to Jan 15: Jan 8 is excluded, Jan 9 is included', () => {
    const outsideWindow = [reading('2027-01-08', -5), reading('2027-01-10', 3)]
    expect(getFrostStatus(getColdestLow(outsideWindow, AS_OF))).toBe('no-risk')

    const onFirstDay = [reading('2027-01-09', -5), reading('2027-01-10', 3)]
    expect(getFrostStatus(getColdestLow(onFirstDay, AS_OF))).toBe('at-risk')
  })

  it('reports no data, not "no risk", when nothing was reported', () => {
    const coldest = getColdestLow([reading('2027-01-15', null), reading('2027-01-14', null)], AS_OF)
    expect(coldest).toBeNull()
    expect(getFrostStatus(coldest)).toBe('no-data')
  })
})

describe('offline stations', () => {
  it('is offline when there is no reading on the as-of date or the day before', () => {
    const readings = [reading('2027-01-13', 2), reading('2027-01-14', null), reading('2027-01-15', null)]
    expect(isStationOffline(readings, AS_OF)).toBe(true)
  })

  it('is offline when the rows for those two days are missing entirely', () => {
    expect(isStationOffline([reading('2027-01-13', 2)], AS_OF)).toBe(true)
  })

  it('is still online after missing only one of the two days', () => {
    const missedToday = [reading('2027-01-14', 1), reading('2027-01-15', null)]
    expect(isStationOffline(missedToday, AS_OF)).toBe(false)

    const missedYesterday = [reading('2027-01-14', null), reading('2027-01-15', 1)]
    expect(isStationOffline(missedYesterday, AS_OF)).toBe(false)
  })
})
