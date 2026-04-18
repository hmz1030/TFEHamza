import { Link } from 'react-router-dom'
import type { Match } from '../../types'
import { isFinished, isLive, isScheduled } from '../../utils/matchStatus'

interface MatchCardProps {
  match: Match
}

function formatMatchTime(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function getStatusConfig(status: string) {
  if (isLive(status)) {
    return {
      badge: 'En direct',
      badgeClasses: 'border-[rgba(121,182,141,0.24)] bg-[rgba(121,182,141,0.12)] text-[var(--success)]',
      scoreAccent: 'text-[var(--text)]',
      showLiveDot: true,
    }
  }

  if (isFinished(status)) {
    return {
      badge: 'Terminé',
      badgeClasses: 'border-[var(--line)] bg-[rgba(255,255,255,0.04)] text-[var(--muted-strong)]',
      scoreAccent: 'text-[var(--text)]',
      showLiveDot: false,
    }
  }

  return {
    badge: 'À venir',
    badgeClasses: 'border-[rgba(200,132,73,0.3)] bg-[var(--accent-soft)] text-[var(--accent-strong)]',
    scoreAccent: 'text-[var(--muted-strong)]',
    showLiveDot: false,
  }
}

function getRatingConfig(averageRating: number | null) {
  if (averageRating === null) {
    return { label: 'Pas de note', classes: 'border-[var(--line)] bg-[rgba(255,255,255,0.04)] text-[var(--muted)]' }
  }

  if (averageRating > 7) {
    return { label: averageRating.toFixed(1), classes: 'border-[rgba(121,182,141,0.22)] bg-[rgba(121,182,141,0.12)] text-[var(--success)]' }
  }

  if (averageRating >= 5) {
    return { label: averageRating.toFixed(1), classes: 'border-[rgba(200,132,73,0.26)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' }
  }

  return { label: averageRating.toFixed(1), classes: 'border-[rgba(216,125,116,0.24)] bg-[rgba(216,125,116,0.1)] text-[var(--danger)]' }
}

function MatchCard({ match }: MatchCardProps) {
  const { badge, badgeClasses, scoreAccent, showLiveDot } = getStatusConfig(match.status)
  const ratingConfig = getRatingConfig(match.average_rating)
  const scheduled = isScheduled(match.status)

  return (
    <Link
      to={`/matches/${match.id}`}
      className="group block overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(17,27,40,0.9),rgba(11,18,28,0.98))] p-6 shadow-[var(--shadow)] transition duration-200 hover:-translate-y-1 hover:border-[var(--line-strong)]"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-[var(--muted)]">{match.league}</div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
          {showLiveDot ? <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--success)]" /> : null}
          <span>{badge}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-3">
            {match.home_team.logo ? (
              <img
                src={match.home_team.logo}
                alt={match.home_team.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-[var(--muted-strong)]">
                {match.home_team.name.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[var(--text)]">
            {match.home_team.name}
          </h3>
        </div>

        <div className="min-w-[92px] text-center">
          {scheduled ? (
            <>
              <div className="text-3xl font-bold text-[var(--text)]">
                {formatMatchTime(match.date)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                Coup d&apos;envoi
              </div>
            </>
          ) : (
            <>
              <div className={`text-4xl font-bold ${scoreAccent}`}>
                {match.home_score} - {match.away_score}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                {showLiveDot ? 'En cours' : badge}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-3">
            {match.away_team.logo ? (
              <img
                src={match.away_team.logo}
                alt={match.away_team.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-[var(--muted-strong)]">
                {match.away_team.name.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[var(--text)]">
            {match.away_team.name}
          </h3>
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-5">
        <div className="text-sm leading-6 text-[var(--muted)]">
          {badge === 'En direct'
            ? `Coup d'envoi ${formatMatchTime(match.date)}`
            : match.home_team.country || match.away_team.country || match.league}
        </div>
        <div className={`rounded-[1.2rem] border px-4 py-3 text-right ${ratingConfig.classes}`}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] opacity-80">Note</p>
          <p className="mt-1 text-lg font-black tracking-tight">{ratingConfig.label}</p>
        </div>
      </div>
    </Link>
  )
}

export default MatchCard


