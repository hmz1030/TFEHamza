import { useEffect, useState } from 'react'
import LeaderboardTable from '../components/pronostic/LeaderboardTable'
import Loader from '../components/ui/Loader'
import UserAvatar from '../components/user/UserAvatar'
import { useAuth } from '../context/AuthContext'
import { getLeaderboard } from '../services/pronosticService'
import type { LeaderboardEntry, LeaderboardPage } from '../types'

const LEADERBOARD_PAGE_SIZE = 10

function formatRatio(ratio: number | null) {
  return typeof ratio === 'number'
    ? new Intl.NumberFormat('fr-BE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(ratio)
    : '-'
}

function MyLeaderboardCard({ entry, rank }: { entry: LeaderboardEntry | null; rank: number | null }) {
  if (!entry) {
    return (
      <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Ton classement</p>
        <p className="mt-3 text-2xl font-black text-[var(--text)]">Pas encore classe</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Fais des pronostics sur des matchs termines pour apparaitre ici.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[1.8rem] border border-[rgba(200,132,73,0.28)] bg-[rgba(200,132,73,0.1)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 text-center">
          <UserAvatar username={entry.user.username} avatarUrl={entry.user.avatar_url} size="md" />

          <div>
            <p className="mt-1 text-xl font-black text-[var(--text)]">{entry.user.username}</p>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Rang</p>
            <p className="mt-1 text-2xl font-black text-[var(--text)]">{rank}</p>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Points</p>
            <p className="mt-1 text-2xl font-black text-[var(--accent-strong)]">{entry.total_points}</p>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Ratio</p>
            <p className="mt-1 text-2xl font-black text-[var(--text)]">{formatRatio(entry.points_ratio)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LeaderboardPanel() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardPage | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    getLeaderboard(page, LEADERBOARD_PAGE_SIZE)
      .then((response) => setLeaderboard(response.data))
      .catch(() => setError("Impossible de charger le classement."))
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <Loader label="Chargement du classement..." />

  const entries = leaderboard?.results ?? []
  const myEntry = user ? leaderboard?.current_user_entry ?? null : null
  const myRank = user ? leaderboard?.current_user_rank ?? null : null
  const totalPages = leaderboard?.total_pages ?? 1
  const rankOffset = ((leaderboard?.page ?? page) - 1) * LEADERBOARD_PAGE_SIZE

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-[1.6rem] border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">{error}</div> : null}
      {user ? <MyLeaderboardCard entry={myEntry} rank={myRank} /> : null}
      <LeaderboardTable entries={entries} currentUserId={user?.id} rankOffset={rankOffset} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          className="text-action-button text-sm"
        >
          Precedent
        </button>
        <span className="text-sm font-semibold text-[var(--muted)]">
          Page {leaderboard?.page ?? page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages}
          className="text-action-button text-sm"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

function Leaderboard() {
  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Classement</h1>
        <LeaderboardPanel />
      </div>
    </div>
  )
}

export default Leaderboard
