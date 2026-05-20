import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CommentForm from '../components/comment/CommentForm'
import DiscussionFeed from '../components/comment/DiscussionFeed'
import PronosticForm from '../components/pronostic/PronosticForm'
import PronosticList from '../components/pronostic/PronosticList'
import PronosticSummaryCard from '../components/pronostic/PronosticSummaryCard'
import ScoreBadge from '../components/match/ScoreBadge'
import RatingForm from '../components/rating/RatingForm'
import MvpVoteSection from '../components/vote/MvpVoteSection'
import VoteResults from '../components/vote/VoteResults'
import Loader from '../components/ui/Loader'
import { useAuth } from '../context/AuthContext'
import { useMatch } from '../hooks/useMatch'
import { useMatchPlayers } from '../hooks/useMatchPlayers'
import { syncLineups, syncSquads } from '../services/matchService'
import { devToolsEnabled } from '../utils/devTools'
import { isLive } from '../utils/matchStatus'

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
  const { user } = useAuth()
  const { id } = useParams()
  const matchId = Number(id)
  const {
    match,
    ratings,
    comments,
    votes,
    pronostics,
    loading,
    error,
    refetch,
    updateCommentReaction,
  } = useMatch(matchId)
  const { matchPlayers, players, loadingPlayers, refetchPlayers } = useMatchPlayers(matchId)
  const [syncing, setSyncing] = useState<null | 'lineups' | 'squads'>(null)

  if (loading) return <Loader label="Chargement du match..." />

  if (error || !match) {
    return (
      <div className="px-4 py-10 text-center text-[var(--danger)]">
        {error || 'Match introuvable.'}
      </div>
    )
  }

  const handleSyncLineups = async () => {
    setSyncing('lineups')
    try {
      await syncLineups({ matchId: match.id })
      await refetchPlayers()
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncSquads = async () => {
    setSyncing('squads')
    try {
      await syncSquads({ matchId: match.id })
      await refetchPlayers()
    } finally {
      setSyncing(null)
    }
  }

  const myPronostic = pronostics.find((pronostic) => pronostic.user === user?.id)
  const matchLabel = `${match.home_team.name} - ${match.away_team.name}`
  const statusLabel = isLive(match.status) && match.status_display
    ? match.status_display
    : match.status

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(17,27,40,0.96),rgba(8,17,27,0.88))] shadow-[var(--shadow)]">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--accent-strong)]">{match.league}</p>
              <p className="rounded-full border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                {statusLabel}
              </p>
            </div>

            {/* Conteneur principal Flexbox */}
            <div className="flex flex-row items-center justify-between w-full max-w-2xl mx-auto gap-2">

              {/* 1. Équipe à domicile (prend un tiers de l'espace) */}
              <Link
                to={`/teams/${match.home_team.id}`}
                className="group flex flex-1 flex-col items-center rounded-[1.2rem] transition hover:-translate-y-0.5"
              >
                <img
                  src={match.home_team.logo}
                  alt={`Logo ${match.home_team.name}`}
                  className="w-10 h-10 object-contain mb-2 sm:w-16 sm:h-16"
                />
                <p className="text-center text-sm font-bold text-[var(--text)] transition group-hover:text-[var(--accent-strong)] sm:text-xl">
                  {match.home_team.name}
                </p>
              </Link>

              {/* 2. Score et date (au centre) */}
              <div className="flex flex-col items-center px-2">
                <p className="text-3xl font-bold whitespace-nowrap text-[var(--text)] sm:text-5xl">
                  {match.home_score} - {match.away_score}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] sm:text-xs sm:mt-3">
                  {formatMatchDate(match.date)}
                </p>
              </div>

              {/* 3. Équipe à l'extérieur (prend un tiers de l'espace) */}
              <Link
                to={`/teams/${match.away_team.id}`}
                className="group flex flex-1 flex-col items-center rounded-[1.2rem] transition hover:-translate-y-0.5"
              >
                <img
                  src={match.away_team.logo}
                  alt={`Logo ${match.away_team.name}`}
                  className="w-10 h-10 object-contain mb-2 sm:w-16 sm:h-16"
                />
                <p className="text-center text-sm font-bold text-[var(--text)] transition group-hover:text-[var(--accent-strong)] sm:text-xl">
                  {match.away_team.name}
                </p>
              </Link>

            </div>
          </div>
        </section>

        <div className="flex justify-center">
          <ScoreBadge ratings={ratings} className="w-full justify-between sm:w-auto" />
        </div>

        <nav className="flex flex-wrap gap-3">
          <a href="#discussion" className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]">Discussion</a>
          <a href="#pronostics" className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]">Pronostics</a>
          <a href="#votes" className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]">Vote MVP</a>
        </nav>

        <section id="discussion" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[var(--text)]">Discussion</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Reagis au match, lis les avis notes et ajoute ta propre analyse.</p>
            </div>
            <RatingForm matchId={match.id} status={match.status} onCreated={refetch} />
          </div>
          <CommentForm matchId={match.id} onCreated={refetch} />
          <DiscussionFeed
            matchId={match.id}
            comments={comments}
            ratings={ratings}
            matchLabel={matchLabel}
            onCreated={refetch}
            onReactionUpdated={updateCommentReaction}
          />
        </section>

        <section id="pronostics" className="space-y-4">
          <h2 className="text-3xl font-bold text-[var(--text)]">Pronostics</h2>
          {myPronostic ? (
            <PronosticSummaryCard pronostic={myPronostic} match={match} title="Ton pronostic" />
          ) : (
            <PronosticForm matchId={match.id} status={match.status} onCreated={refetch} />
          )}
          <PronosticList pronostics={pronostics} />
        </section>

        <section id="votes" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-[var(--text)]">Vote MVP</h2>
            {devToolsEnabled ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSyncLineups}
                  disabled={syncing !== null}
                  className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-xs font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)] disabled:opacity-60"
                >
                  {syncing === 'lineups' ? 'Sync lineup...' : 'Dev: sync lineup'}
                </button>
                <button
                  type="button"
                  onClick={handleSyncSquads}
                  disabled={syncing !== null}
                  className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-xs font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)] disabled:opacity-60"
                >
                  {syncing === 'squads' ? 'Sync squad...' : 'Dev: sync squad'}
                </button>
              </div>
            ) : null}
          </div>
          <MvpVoteSection
            match={match}
            matchPlayers={matchPlayers}
            votes={votes}
            loadingPlayers={loadingPlayers}
            onCreated={refetch}
          />
          <VoteResults votes={votes} players={players} />
        </section>
      </div>
    </div>
  )
}

export default MatchDetail
