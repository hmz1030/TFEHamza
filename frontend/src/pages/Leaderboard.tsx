import { useEffect, useState } from 'react'
import LeaderboardTable from '../components/pronostic/LeaderboardTable'
import Loader from '../components/ui/Loader'
import { getLeaderboard } from '../services/pronosticService'
import type { LeaderboardEntry } from '../types'

function Leaderboard() {
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

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Classement</h1>
        {error ? <div className="rounded-[1.6rem] border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">{error}</div> : null}
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  )
}

export default Leaderboard
