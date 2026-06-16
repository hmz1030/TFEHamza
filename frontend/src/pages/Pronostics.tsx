import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { LeaderboardPanel } from './Leaderboard'
import { PronosticGroupsPanel } from './PronosticGroups'
import PronosticForm from '../components/pronostic/PronosticForm'
import PronosticSummaryCard from '../components/pronostic/PronosticSummaryCard'
import Loader from '../components/ui/Loader'
import type { Match, Pronostic as PronosticType } from '../types'
import { useAuth } from '../context/AuthContext'
import { getMatches, syncTodayMatches } from '../services/matchService'
import { getMyActivity } from '../services/userService'
import { isScheduled } from '../utils/matchStatus'
import { devToolsEnabled } from '../utils/devTools'

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

const ALL_LEAGUES = 'all'
const TABS = [
  { id: 'pronostics', label: 'Matchs a pronostiquer' },
  { id: 'historique', label: 'Mes pronostics' },
  { id: 'classement', label: 'Classement' },
  { id: 'groupes', label: 'Groupes' },
] as const

type PronosticTab = typeof TABS[number]['id']

function Pronostics() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [matches, setMatches] = useState<Match[]>([])
  const [history, setHistory] = useState<PronosticType[]>([])
  const [loading, setLoading] = useState(true)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [leagueFilter, setLeagueFilter] = useState<string>(ALL_LEAGUES)
  const requestedTab = searchParams.get('tab')
  const activeTab: PronosticTab =
    requestedTab === 'historique' || requestedTab === 'classement' || requestedTab === 'groupes'
      ? requestedTab
      : 'pronostics'

  useEffect(() => {
    loadPronosticsData()
      .then((data) => {
        setMatches(data.matches)
        setHistory(data.history)
      })
      .catch(() => setError('Impossible de charger les pronostics.'))
      .finally(() => setLoading(false))
  }, [])

  const selectTab = (tab: PronosticTab) => {
    setSearchParams(tab === 'pronostics' ? {} : { tab })
  }

  const tabs = (
    <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => selectTab(tab.id)}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            activeTab === tab.id
              ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
              : 'text-[var(--muted-strong)] hover:bg-white/[0.04] hover:text-[var(--text)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )

  if (activeTab === 'classement') {
    return (
      <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Pronostics</h1>
          {tabs}
          <LeaderboardPanel />
        </div>
      </div>
    )
  }

  if (activeTab === 'groupes') {
    return (
      <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Pronostics</h1>
          {tabs}
          <PronosticGroupsPanel />
        </div>
      </div>
    )
  }

  if (loading) return <Loader label="Chargement des pronostics..." />

  const now = Date.now()
  const allUpcomingMatches = matches
    .filter((match) => isScheduled(match.status))
    .filter((match) => new Date(match.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const availableLeagues = Array.from(new Set(allUpcomingMatches.map((match) => match.league))).sort()
  const upcomingMatches = leagueFilter === ALL_LEAGUES
    ? allUpcomingMatches
    : allUpcomingMatches.filter((match) => match.league === leagueFilter)

  const historyByDate = [...history]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const matchById = new Map(matches.map((match) => [match.id, match]))
  const myPronosticByMatchId = new Map(history.map((pronostic) => [pronostic.match, pronostic]))

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

  if (activeTab === 'historique') {
    return (
      <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Pronostics</h1>
          {tabs}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text)]">Mes pronostics</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Retrouve tes scores joues et les points gagnes.</p>
            </div>

            <div className="space-y-4">
              {historyByDate.length === 0 ? (
                <div className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                  Aucun pronostic enregistre pour l'instant.
                </div>
              ) : historyByDate.map((pronostic) => {
                const match = matchById.get(pronostic.match)
                return (
                  <div key={pronostic.id} className="space-y-2">
                    <p className="text-sm text-[var(--muted)]">{match ? formatMatchDate(match.date) : formatMatchDate(pronostic.created_at)}</p>
                    <PronosticSummaryCard pronostic={pronostic} match={match} title="Ton pronostic" />
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Pronostics</h1>
        {tabs}

        {error ? (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text)]">A venir</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Pronostique rapidement les prochains matchs.</p>
            </div>

            {devToolsEnabled ? (
              <button
                type="button"
                onClick={handleSyncUpcoming}
                disabled={syncLoading}
                className="rounded-md border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--line-strong)] hover:text-[var(--text)] disabled:opacity-60"
              >
                {syncLoading ? 'Synchronisation...' : 'Sync 14 jours'}
              </button>
            ) : null}
          </div>

          {syncMessage ? (
            <div className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-4 text-sm text-[var(--muted-strong)]">
              {syncMessage}
            </div>
          ) : null}

          {availableLeagues.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Championnat :</span>
              <button
                type="button"
                onClick={() => setLeagueFilter(ALL_LEAGUES)}
                className={`rounded-md border px-4 py-1.5 text-xs font-semibold transition ${
                  leagueFilter === ALL_LEAGUES
                    ? 'border-[var(--accent-strong)] bg-[var(--accent-strong)]/15 text-[var(--text)]'
                    : 'border-[var(--line)] bg-[rgba(17,27,40,0.6)] text-[var(--muted-strong)] hover:border-[var(--line-strong)] hover:text-[var(--text)]'
                }`}
              >
                Tous ({allUpcomingMatches.length})
              </button>
              {availableLeagues.map((league) => {
                const count = allUpcomingMatches.filter((match) => match.league === league).length
                const isActive = leagueFilter === league
                return (
                  <button
                    key={league}
                    type="button"
                    onClick={() => setLeagueFilter(league)}
                    className={`rounded-md border px-4 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'border-[var(--accent-strong)] bg-[var(--accent-strong)]/15 text-[var(--text)]'
                        : 'border-[var(--line)] bg-[rgba(17,27,40,0.6)] text-[var(--muted-strong)] hover:border-[var(--line-strong)] hover:text-[var(--text)]'
                    }`}
                  >
                    {league} ({count})
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <div className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                {leagueFilter === ALL_LEAGUES
                  ? 'Aucun match a pronostiquer pour le moment.'
                  : `Aucun match a venir pour ${leagueFilter}.`}
              </div>
            ) : upcomingMatches.map((match) => {
              const myPronostic = myPronosticByMatchId.get(match.id)

              return myPronostic ? (
                <article key={match.id} className="mx-auto w-full max-w-2xl rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
                  <p className="mb-4 text-center text-sm uppercase tracking-[0.18em] text-[var(--accent-strong)]">{match.league}</p>
                  <PronosticSummaryCard pronostic={myPronostic} match={match} title={user ? 'Pronostic deja envoye' : undefined} />
                </article>
              ) : (
                <div key={match.id} className="mx-auto w-full max-w-2xl">
                  <p className="mb-3 text-center text-sm uppercase tracking-[0.18em] text-[var(--accent-strong)]">{match.league}</p>
                  <PronosticForm
                    matchId={match.id}
                    status={match.status}
                    homeTeam={match.home_team}
                    awayTeam={match.away_team}
                    onCreated={refetchHistory}
                  />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Pronostics
