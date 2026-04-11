import { useEffect, useState } from 'react'
import PronosticForm from '../components/pronostic/PronosticForm'
import Loader from '../components/ui/Loader'
import type { Match, Pronostic as PronosticType } from '../types'
import { getMatches } from '../services/matchService'
import { getMyActivity } from '../services/userService'

function Pronostics() {
  const [matches, setMatches] = useState<Match[]>([])
  const [history, setHistory] = useState<PronosticType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getMatches(), getMyActivity()])
      .then(([matchesResponse, activityResponse]) => {
        setMatches(matchesResponse.data)
        setHistory(activityResponse.data.pronostics)
      })
      .catch(() => setError("Impossible de charger les pronostics."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Chargement des pronostics..." />

  const upcomingMatches = matches
    .filter((match) => match.status.toLowerCase() === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const historyByDate = [...history]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const matchById = new Map(matches.map((match) => [match.id, match]))

  const refetchHistory = async () => {
    const activityResponse = await getMyActivity()
    setHistory(activityResponse.data.pronostics)
  }

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Pronostics</h1>

        {error ? (
          <div className="rounded-[1.6rem] border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">A venir</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Pronostique rapidement les prochains matchs.</p>
          </div>

          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <article key={match.id} className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent-strong)]">{match.league}</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--text)]">{match.home_team.name} vs {match.away_team.name}</p>
                  </div>
                </div>
                <PronosticForm matchId={match.id} status={match.status} onCreated={refetchHistory} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Pronostics
