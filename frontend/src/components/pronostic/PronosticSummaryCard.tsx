import type { Match, Pronostic, Team } from '../../types'
import { isFinished } from '../../utils/matchStatus'

interface PronosticSummaryCardProps {
  pronostic: Pronostic
  match?: Match | null
  title?: string
}

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function TeamPill({ team }: { team: Team }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-md border border-[var(--line)] bg-[rgba(255,255,255,0.03)] py-1 pl-1 pr-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white p-1">
        {team.logo ? (
          <img src={team.logo} alt={team.name} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[0.62rem] font-black text-[var(--bg-deep)]">
            {team.name.slice(0, 3).toUpperCase()}
          </span>
        )}
      </span>
      <span className="truncate text-sm font-semibold text-[var(--text)]">{team.name}</span>
    </span>
  )
}

function PronosticSummaryCard({ pronostic, match, title }: PronosticSummaryCardProps) {
  const hasFinalScore = typeof match?.home_score === 'number' && typeof match?.away_score === 'number'
  const showFinalScore = hasFinalScore && isFinished(match?.status ?? '')

  return (
    <article className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--muted-strong)]">{title || pronostic.user_username}</p>
          {match ? (
            <>
              <div className="mt-2 flex max-w-full flex-wrap items-center gap-2">
                <TeamPill team={match.home_team} />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">vs</span>
                <TeamPill team={match.away_team} />
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {formatMatchDate(match.date)}
              </p>
            </>
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
