import type { FrostStatus } from '../lib/frost'

const BADGE_TEXT: Record<FrostStatus, string> = {
  'at-risk': 'Frost risk',
  'no-risk': 'No risk',
  'no-data': 'No data',
}

const BADGE_ICON: Record<FrostStatus, string> = {
  'at-risk': '❄',
  'no-risk': '✓',
  'no-data': '?',
}

// The text carries the meaning; the icon and colour only reinforce it
export function FrostBadge({ status }: { status: FrostStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      <span aria-hidden="true">{BADGE_ICON[status]}</span> {BADGE_TEXT[status]}
    </span>
  )
}
