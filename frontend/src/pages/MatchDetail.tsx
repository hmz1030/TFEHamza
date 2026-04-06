import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PronosticForm from '../components/pronostic/PronosticForm'
import PronosticList from '../components/pronostic/PronosticList'
import ScoreBadge from '../components/match/ScoreBadge'
import RatingForm from '../components/rating/RatingForm'
import RatingList from '../components/rating/RatingList'
import VoteForm from '../components/vote/VoteForm'
import VoteResults from '../components/vote/VoteResults'
import Loader from '../components/ui/Loader'
import { useMatch } from '../hooks/useMatch'
import { useMatchPlayers } from '../hooks/useMatchPlayers'
import { syncMatchPlayers } from '../services/matchService'

const isDev = import.meta.env.DEV

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function MatchDetail() {
  const { id } = useParams()
  const matchId = Number(id)
  const { match, ratings, votes, pronostics, loading, error, refetch } = useMatch(matchId)
  const { players, loadingPlayers, refetchPlayers } = useMatchPlayers(matchId)
  const [syncingPlayers, setSyncingPlayers] = useState(false)

  if (loading) return <Loader label="Chargement du match..." />

  if (error || !match) {
    return (
      <div className="px-4 py-10 text-center text-[var(--danger)]">
        {error || 'Match introuvable.'}
      </div>
    )
  }

  const handleSyncPlayers = async () => {
    setSyncingPlayers(true)
    try {
      await syncMatchPlayers(match.id)
      await refetchPlayers()
    } finally {
      setSyncingPlayers(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(17,27,40,0.96),rgba(8,17,27,0.88))] shadow-[var(--shadow)]">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--accent-strong)]">{match.league}</p>
              <p className="rounded-full border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                {match.status}
              </p>
            </div>

            <div className="mt-8 grid items-center gap-6 text-center md:grid-cols-[1fr_auto_1fr]">
              <div>
                <p className="text-xl font-bold text-[var(--text)] sm:text-3xl">{match.home_team.name}</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-[var(--text)] sm:text-6xl">
                  {match.home_score} - {match.away_score}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  {formatMatchDate(match.date)}
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text)] sm:text-3xl">{match.away_team.name}</p>
              </div>
            </div>
          </div>
        </section>

        <nav className="flex flex-wrap gap-3">
          <a href="#pronostics" className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]">Pronostics</a>
          <a href="#ratings" className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]">Notes</a>
          <a href="#votes" className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]">Vote MVP</a>
        </nav>

        <section id="pronostics" className="space-y-4">
          <h2 className="text-3xl font-bold text-[var(--text)]">Pronostics</h2>
          <PronosticForm matchId={match.id} status={match.status} onCreated={refetch} />
          <PronosticList pronostics={pronostics} />
        </section>

        <section id="ratings" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-[var(--text)]">Notes</h2>
            <ScoreBadge ratings={ratings} />
          </div>
          <RatingForm matchId={match.id} status={match.status} onCreated={refetch} />
          <RatingList ratings={ratings} />
        </section>

        <section id="votes" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-[var(--text)]">Vote MVP</h2>
            {isDev && players.length === 0 && !loadingPlayers ? (
              <button
                type="button"
                onClick={handleSyncPlayers}
                disabled={syncingPlayers}
                className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)] disabled:opacity-60"
              >
                {syncingPlayers ? 'Sync des joueurs...' : 'Synchroniser les joueurs (dev)'}
              </button>
            ) : null}
          </div>
          <VoteForm match={match} players={players} onCreated={refetch} />
          <VoteResults votes={votes} players={players} />
        </section>
      </div>
    </div>
  )
}

export default MatchDetail
