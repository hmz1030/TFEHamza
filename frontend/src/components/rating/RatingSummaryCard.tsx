import { Link } from 'react-router-dom'
import type { Match } from '../../types'
import type { ActivityData } from '../../services/userService'

interface RatingSummaryCardProps {
  rating: ActivityData['ratings'][number]
  match?: Match
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function RatingSummaryCard({ rating, match }: RatingSummaryCardProps) {
  const matchLabel = match ? `${match.home_team.name} - ${match.away_team.name}` : 'Match'

  return (
    <Link
      to={`/matches/${rating.match}`}
      className="block rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4 transition hover:border-[var(--accent-strong)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{formatDate(rating.created_at)}</p>
          <h3 className="mt-2 text-base font-bold text-[var(--text)]">{matchLabel}</h3>
        </div>
        <span className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-black text-[var(--bg-deep)]">
          {rating.score}/10
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted-strong)]">
        {rating.comment.trim() || 'Note envoyee sans commentaire.'}
      </p>
    </Link>
  )
}

export default RatingSummaryCard
