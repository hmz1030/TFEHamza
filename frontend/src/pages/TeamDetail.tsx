import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import { getTeamOverview } from '../services/teamService'
import type { Match, TeamOverview, TeamOverviewPlayer } from '../types'
import { isScheduled } from '../utils/matchStatus'

function currentSeason() {
  const today = new Date()
  return today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatRating(value: number | null) {
  return value === null ? '-' : value.toFixed(1)
}

function MatchRow({ match }: { match: Match }) {
  const scheduled = isScheduled(match.status)
  const score = scheduled ? formatDate(match.date) : `${match.home_score} - ${match.away_score}`

  return (
    <Link
      to={`/matches/${match.id}`}
      className="grid gap-4 rounded-[1.4rem] border border-[var(--line)] bg-[rgba(17,27,40,0.82)] p-4 transition hover:border-[var(--accent-strong)] md:grid-cols-[1fr_auto]"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          {match.league} · {formatDate(match.date)}
        </p>
        <div className="mt-3 space-y-2">
          {[match.home_team, match.away_team].map((team) => (
            <div key={team.id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1">
                {team.logo ? <img src={team.logo} alt="" className="h-full w-full object-contain" /> : null}
              </span>
              <span className="font-bold text-[var(--text)]">{team.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="self-center rounded-full border border-[var(--line)] bg-white/[0.04] px-4 py-2 text-center text-lg font-black text-[var(--accent-strong)]">
        {score}
      </div>
    </Link>
  )
}

function PlayerCard({ player, rank }: { player: TeamOverviewPlayer; rank: number }) {
  return (
    <article className="min-w-[13rem] rounded-[1.5rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(35,52,69,0.94),rgba(17,27,40,0.96))] p-4">
      <div className="flex items-start justify-between">
        <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-black text-[var(--bg-deep)]">
          #{rank}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          {player.position || 'Joueur'}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          {player.image ? (
            <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-black text-[var(--bg-deep)]">{player.name.slice(0, 2).toUpperCase()}</span>
          )}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-[var(--text)]">{player.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {player.matches_played} match{player.matches_played > 1 ? 's' : ''} joue{player.matches_played > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-[1rem] border border-[rgba(121,182,141,0.22)] bg-[rgba(121,182,141,0.1)] px-4 py-3 text-center">
        <p className="text-3xl font-black text-[var(--success)]">{player.mvp_votes}</p>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">votes MVP</p>
      </div>
    </article>
  )
}

function TeamDetail() {
  const { id } = useParams()
  const teamId = Number(id)
  const [season, setSeason] = useState(currentSeason())
  const [overview, setOverview] = useState<TeamOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllMatches, setShowAllMatches] = useState(false)

  useEffect(() => {
    if (!teamId) return

    setLoading(true)
    setError('')
    getTeamOverview(teamId, season)
      .then((response) => setOverview(response.data))
      .catch(() => setError('Impossible de charger ce club.'))
      .finally(() => setLoading(false))
  }, [season, teamId])

  const seasonOptions = useMemo(() => {
    const base = currentSeason()
    return [base + 1, base, base - 1, base - 2]
  }, [])

  const visibleMatches = showAllMatches ? overview?.recent_matches : overview?.recent_matches.slice(0, 3)

  if (loading) return <Loader label="Chargement du club..." />

  if (error || !overview) {
    return (
      <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-8">
          <p className="text-lg font-bold">{error || 'Club introuvable.'}</p>
          <Link to="/" className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--bg-deep)]">
            Retour accueil
          </Link>
        </div>
      </div>
    )
  }

  const { team, activity } = overview
  const completion = activity.total_matches ? Math.round((activity.rated_matches / activity.total_matches) * 100) : 0

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2.2rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(35,52,69,0.94),rgba(17,27,40,0.96))] p-6 text-center shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <Link to="/" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--muted-strong)] transition hover:text-[var(--text)]">
              Retour
            </Link>
            <select
              value={season}
              onChange={(event) => setSeason(Number(event.target.value))}
              className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-bold text-[var(--text)] outline-none"
            >
              {seasonOptions.map((year) => (
                <option key={year} value={year}>
                  {year}-{year + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-full bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
            {team.logo ? <img src={team.logo} alt={team.name} className="h-full w-full object-contain" /> : null}
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-[var(--text)] sm:text-5xl">{team.name}</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--muted-strong)]">{team.country || team.league}</p>
        </section>

        <section className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
          <p className="inline-flex rounded-full border border-[var(--line)] bg-white/[0.05] px-4 py-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Ton activite
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.4rem] bg-white/[0.035] p-4">
              <p className="text-sm text-[var(--muted)]">Matchs notes</p>
              <p className="mt-2 text-3xl font-black">{activity.rated_matches} / {activity.total_matches}</p>
            </div>
            <div className="rounded-[1.4rem] bg-white/[0.035] p-4">
              <p className="text-sm text-[var(--muted)]">Progression</p>
              <p className="mt-2 text-3xl font-black text-[var(--accent-strong)]">{completion}%</p>
            </div>
            <div className="rounded-[1.4rem] bg-white/[0.035] p-4">
              <p className="text-sm text-[var(--muted)]">Ta moyenne</p>
              <p className="mt-2 text-3xl font-black text-[var(--accent-strong)]">{formatRating(activity.average_rating)}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[var(--accent-strong)]">Matchs</p>
              <h2 className="mt-2 text-3xl font-black">Matchs recents</h2>
            </div>
            {overview.recent_matches.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllMatches((current) => !current)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--muted-strong)] transition hover:border-[var(--accent-strong)] hover:text-[var(--text)]"
              >
                {showAllMatches ? 'Voir moins' : 'Voir plus'}
              </button>
            ) : null}
          </div>

          {visibleMatches?.length ? (
            <div className="grid gap-3">
              {visibleMatches.map((match) => <MatchRow key={match.id} match={match} />)}
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6 text-sm text-[var(--muted)]">
              Aucun match trouve pour cette saison.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[var(--accent-strong)]">MVP</p>
            <h2 className="mt-2 text-3xl font-black">Top joueurs</h2>
          </div>

          {overview.top_players.length ? (
            <div className="flex gap-4 overflow-x-auto pb-3">
              {overview.top_players.map((player, index) => (
                <PlayerCard key={player.id} player={player} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6 text-sm text-[var(--muted)]">
              Aucun joueur trouve pour ce club.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default TeamDetail
