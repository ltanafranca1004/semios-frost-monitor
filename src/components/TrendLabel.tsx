import type { Trend } from '../lib/frost'

const TREND_TEXT: Record<Trend, string> = {
  colder: 'Colder',
  warmer: 'Warmer',
  steady: 'Steady',
  'no-data': 'No data',
}

const TREND_ARROW: Record<Trend, string> = {
  colder: '↓',
  warmer: '↑',
  steady: '→',
  'no-data': '–',
}

// Arrow plus a word, so the trend reads without relying on the arrow alone
export function TrendLabel({ trend }: { trend: Trend }) {
  return (
    <span>
      <span aria-hidden="true">{TREND_ARROW[trend]}</span> {TREND_TEXT[trend]}
    </span>
  )
}
