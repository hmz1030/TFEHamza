import { useEffect, useState } from 'react'
import LeaderboardTable from '../components/pronostic/LeaderboardTable'
import Loader from '../components/ui/Loader'
import UserAvatar from '../components/user/UserAvatar'
import { useAuth } from '../context/AuthContext'
import { getLeaderboard } from '../services/pronosticService'
import type { LeaderboardEntry } from '../types'

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
        <div className="flex items-center gap-3">
          <UserAvatar username={entry.user.username} avatarUrl={entry.user.avatar_url} size="md" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">Ton classement</p>
            <p className="mt-1 text-xl font-black text-[var(--text)]">{entry.user.username}</p>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-3 text-center sm:w-auto sm:min-w-[420px]">
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,18,0.22)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Rang</p>
            <p className="mt-1 text-2xl font-black text-[var(--text)]">#{rank}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,18,0.22)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Points</p>
            <p className="mt-1 text-2xl font-black text-[var(--accent-strong)]">{entry.total_points}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,18,0.22)] px-4 py-3">
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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getLeaderboard()
      .then((response) => setEntries(response.data))
      .catch(() => setError("Impossible de charger le classement."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Chargement du classement..." />

  const myIndex = user ? entries.findIndex((entry) => entry.user.id === user.id) : -1
  const myEntry = myIndex >= 0 ? entries[myIndex] : null
  const myRank = myIndex >= 0 ? myIndex + 1 : null

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-[1.6rem] border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">{error}</div> : null}
      {user ? <MyLeaderboardCard entry={myEntry} rank={myRank} /> : null}
      <LeaderboardTable entries={entries} currentUserId={user?.id} />
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
