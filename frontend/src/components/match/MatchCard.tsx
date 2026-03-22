import { Link } from 'react-router-dom'
import type { Match } from '../../types'

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
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes('live') || normalizedStatus.includes('direct') || normalizedStatus.includes('progress')) {
    return {
      badge: 'EN DIRECT',
      badgeClasses: 'bg-emerald-500/15 text-emerald-300',
      actionLabel: 'VOIR LES DÉTAILS',
      scoreAccent: 'text-white',
      showLiveDot: true,
    }
  }

  if (normalizedStatus.includes('finish') || normalizedStatus.includes('term')) {
    return {
      badge: 'Terminé',
      badgeClasses: 'bg-slate-700/70 text-slate-200',
      actionLabel: 'VOIR LE RÉSUMÉ',
      scoreAccent: 'text-white',
      showLiveDot: false,
    }
  }

  return {
    badge: 'À venir',
    badgeClasses: 'bg-blue-500/15 text-blue-300',
    actionLabel: 'PRONOSTIQUER',
    scoreAccent: 'text-slate-300',
    showLiveDot: false,
  }
}

function MatchCard({ match }: MatchCardProps) {
  const { badge, badgeClasses, actionLabel, scoreAccent, showLiveDot } = getStatusConfig(match.status)
  const isScheduled = badge === 'À venir'

  return (
    <Link
      to={`/matches/${match.id}`}
      className="group block overflow-hidden rounded-[2rem] bg-slate-800/70 p-6 shadow-[0_20px_40px_-18px_rgba(0,0,0,0.65)] ring-1 ring-white/5 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-[0_28px_60px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-400">{match.league}</div>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
          {showLiveDot && <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />}
          <span>{badge}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-950/60 p-3 shadow-inner shadow-black/20">
            {match.home_team.logo ? (
              <img
                src={match.home_team.logo}
                alt={match.home_team.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-slate-300">
                {match.home_team.name.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold tracking-tight text-slate-100">
            {match.home_team.name}
          </h3>
        </div>

        <div className="min-w-[88px] text-center">
          {isScheduled ? (
            <>
              <div className="text-3xl font-bold tracking-[-0.02em] text-slate-100">
                {formatMatchTime(match.date)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                Aujourd&apos;hui
              </div>
            </>
          ) : (
            <>
              <div className={`text-4xl font-bold tracking-[-0.02em] ${scoreAccent}`}>
                {match.home_score} - {match.away_score}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                {showLiveDot ? "En cours" : badge}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-950/60 p-3 shadow-inner shadow-black/20">
            {match.away_team.logo ? (
              <img
                src={match.away_team.logo}
                alt={match.away_team.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-slate-300">
                {match.away_team.name.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold tracking-tight text-slate-100">
            {match.away_team.name}
          </h3>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {badge === 'EN DIRECT'
            ? `Coup d'envoi ${formatMatchTime(match.date)}`
            : match.home_team.country || match.away_team.country || match.league}
        </div>
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-300 transition group-hover:text-blue-200">
          {actionLabel}
        </span>
      </div>
    </Link>
  )
}

export default MatchCard
