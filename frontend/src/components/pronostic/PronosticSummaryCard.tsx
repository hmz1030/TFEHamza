import type { Match, Pronostic } from '../../types'
import { isFinished } from '../../utils/matchStatus'

interface PronosticSummaryCardProps {
  pronostic: Pronostic
  match?: Match | null
  title?: string
}

function PronosticSummaryCard({ pronostic, match, title }: PronosticSummaryCardProps) {
  const hasFinalScore = typeof match?.home_score === 'number' && typeof match?.away_score === 'number'
  const showFinalScore = hasFinalScore && isFinished(match?.status ?? '')

  return (
    <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--muted-strong)]">{title || pronostic.user_username}</p>
          {match ? (
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">
              {match.home_team.name} vs {match.away_team.name}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Pronostic</p>
          <p className="mt-1 text-lg font-black tracking-tight text-[var(--accent-strong)]">
            {pronostic.home_score} - {pronostic.away_score}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
        <p className="text-xs font-medium text-[var(--muted)]">
          {pronostic.points === null ? 'Points en attente' : `${pronostic.points} point${pronostic.points > 1 ? 's' : ''}`}
        </p>
        {match ? (
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Résultat</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">
              {showFinalScore ? `${match.home_score} - ${match.away_score}` : 'Match à venir'}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default PronosticSummaryCard
