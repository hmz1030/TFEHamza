import { useEffect, useState } from 'react'
import axios from 'axios'
import PronosticForm from '../components/pronostic/PronosticForm'
import Loader from '../components/ui/Loader'
import type { Match, Pronostic as PronosticType } from '../types'
import { getMatches, syncTodayMatches } from '../services/matchService'
import { getMyActivity } from '../services/userService'

const isDev = import.meta.env.DEV

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

async function loadPronosticsData() {
  const [matchesResponse, activityResponse] = await Promise.all([getMatches(), getMyActivity()])
  return {
    matches: matchesResponse.data,
    history: activityResponse.data.pronostics,
  }
}

function Pronostics() {
  const [matches, setMatches] = useState<Match[]>([])
  const [history, setHistory] = useState<PronosticType[]>([])
  const [loading, setLoading] = useState(true)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPronosticsData()
      .then((data) => {
        setMatches(data.matches)
        setHistory(data.history)
      })
      .catch(() => setError("Impossible de charger les pronostics."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Chargement des pronostics..." />

  const now = Date.now()
  const upcomingMatches = matches
    .filter((match) => match.status.toLowerCase() === 'scheduled')
    .filter((match) => new Date(match.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const historyByDate = [...history]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const matchById = new Map(matches.map((match) => [match.id, match]))

  const refetchHistory = async () => {
    const data = await loadPronosticsData()
    setMatches(data.matches)
    setHistory(data.history)
  }

  const handleSyncUpcoming = async () => {
    setSyncLoading(true)
    setSyncMessage(null)

    try {
      const response = await syncTodayMatches(undefined, 14)
      await refetchHistory()
      setSyncMessage(response.data.detail || 'Matchs a venir synchronises.')
    } catch (syncError) {
      if (axios.isAxiosError(syncError) && typeof syncError.response?.data?.detail === 'string') {
        setSyncMessage(syncError.response.data.detail)
      } else {
        setSyncMessage('La synchronisation des prochains matchs a echoue.')
      }
    } finally {
      setSyncLoading(false)
    }
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
            {upcomingMatches.length === 0 ? (
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun match a pronostiquer pour le moment.
              </div>
            ) : upcomingMatches.map((match) => (
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

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Mes pronostics</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Retrouve tes scores joues et les points gagnes.</p>
          </div>

          <div className="space-y-4">
            {historyByDate.length === 0 ? (
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun pronostic enregistre pour l'instant.
              </div>
            ) : historyByDate.map((pronostic) => {
              const match = matchById.get(pronostic.match)
              return (
                <article key={pronostic.id} className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-[var(--text)]">{match ? `${match.home_team.name} vs ${match.away_team.name}` : `Match #${pronostic.match}`}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">{match ? formatMatchDate(match.date) : formatMatchDate(pronostic.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tracking-tight text-[var(--accent-strong)]">{pronostic.home_score} - {pronostic.away_score}</p>
                      <p className="mt-2 text-xs font-medium text-[var(--muted)]">{pronostic.points === null ? 'Points en attente' : `${pronostic.points} point${pronostic.points > 1 ? 's' : ''}`}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Pronostics
