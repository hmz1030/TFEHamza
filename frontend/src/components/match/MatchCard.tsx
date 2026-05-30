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
      badgeClasses: 'border-[rgba(121,182,141,0.34)] bg-[rgba(121,182,141,0.14)] text-[var(--success)]',
      scoreAccent: 'text-[var(--text)]',
      showLiveDot: true,
    }
  }

  if (isFinished(status)) {
    return {
      badge: 'Terminé',
      badgeClasses: 'border-[rgba(232,227,217,0.16)] bg-[rgba(255,255,255,0.05)] text-[var(--muted-strong)]',
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
    return {
      label: '--',
      caption: 'Pas de note',
      classes: 'border-[rgba(232,227,217,0.16)] bg-[rgba(255,255,255,0.05)] text-[var(--muted)]',
    }
  }

  if (averageRating > 7) {
    return {
      label: averageRating.toFixed(1),
      caption: 'Très bien noté',
      classes: 'border-[rgba(121,182,141,0.28)] bg-[rgba(121,182,141,0.13)] text-[var(--success)]',
    }
  }

  if (averageRating >= 5) {
    return {
      label: averageRating.toFixed(1),
      caption: 'Avis partagés',
      classes: 'border-[rgba(200,132,73,0.3)] bg-[var(--accent-soft)] text-[var(--accent-strong)]',
    }
  }

  return {
    label: averageRating.toFixed(1),
    caption: 'Note faible',
    classes: 'border-[rgba(216,125,116,0.28)] bg-[rgba(216,125,116,0.12)] text-[var(--danger)]',
  }
}

function getLiveLabel(match: Match) {
  if (!isLive(match.status)) return null
  return match.status_display || 'Live'
}

function MatchCard({ match }: MatchCardProps) {
  const { badge, badgeClasses, scoreAccent, showLiveDot } = getStatusConfig(match.status)
  const ratingConfig = getRatingConfig(match.average_rating)
  const scheduled = isScheduled(match.status)
  const liveLabel = getLiveLabel(match)

  return (
    <Link
      to={`/matches/${match.id}`}
      className="match-ticket group grid overflow-hidden rounded-lg border border-[rgba(232,227,217,0.14)] bg-[linear-gradient(135deg,rgba(22,30,25,0.96),rgba(9,15,21,0.98))] shadow-[var(--shadow)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(232,227,217,0.28)] sm:grid-cols-[1fr_9.5rem]"
    >
      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="sports-heading truncate text-xl text-[var(--text)]">{match.league}</p>
          </div>
          <div className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] ${badgeClasses}`}>
            {showLiveDot ? <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--success)]" /> : null}
            <span>{liveLabel ?? badge}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="min-w-0 text-left">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md border border-[rgba(232,227,217,0.14)] bg-[rgba(255,255,255,0.06)] p-2.5">
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
            <h3 className="line-clamp-2 text-base font-extrabold leading-tight text-[var(--text)] sm:text-lg">
              {match.home_team.name}
            </h3>
            <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Domicile</p>
          </div>

          <div className="min-w-[86px] text-center">
            {scheduled ? (
              <>
                <div className="sports-heading text-3xl leading-none text-[var(--text)]">
                  {formatMatchTime(match.date)}
                </div>
                <div className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Coup d&apos;envoi
                </div>
              </>
            ) : (
              <>
                <div className={`sports-heading text-4xl leading-none ${scoreAccent}`}>
                  {match.home_score ?? '-'} - {match.away_score ?? '-'}
                </div>
                <div className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  {liveLabel ?? (showLiveDot ? 'En cours' : badge)}
                </div>
              </>
            )}
          </div>

          <div className="min-w-0 text-right">
            <div className="mb-3 ml-auto flex h-14 w-14 items-center justify-center rounded-md border border-[rgba(232,227,217,0.14)] bg-[rgba(255,255,255,0.06)] p-2.5">
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
            <h3 className="line-clamp-2 text-base font-extrabold leading-tight text-[var(--text)] sm:text-lg">
              {match.away_team.name}
            </h3>
            <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Exterieur</p>
          </div>
        </div>
      </div>

      <div className={`relative flex items-center justify-between gap-4 border-t border-dashed border-[rgba(232,227,217,0.18)] p-4 sm:block sm:border-l sm:border-t-0 sm:text-center ${ratingConfig.classes}`}>
        <span className="ticket-perforation pointer-events-none absolute bottom-4 left-0 top-4 hidden w-px sm:block" aria-hidden="true" />
        <div>
          <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] opacity-80">Note moyenne</p>
          <p className="sports-heading mt-1 text-4xl leading-none tracking-normal">{ratingConfig.label}</p>
          <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] opacity-70">/10</p>
        </div>
        <div className="text-right sm:mt-4 sm:text-center">
          <p className="text-xs font-semibold opacity-80">{ratingConfig.caption}</p>

        </div>
      </div>
    </Link>
  )
}

export default MatchCard

