import { useMemo, useState } from 'react'
import axios from 'axios'
import Loader from '../components/ui/Loader'
import LeagueFilter, { type LeagueFilterValue } from '../components/match/LeagueFilter'
import MatchList from '../components/match/MatchList'
import { useMatches } from '../hooks/useMatches'
import { syncTodayMatches } from '../services/matchService'

const isDev = import.meta.env.DEV

function Home() {
  const [selectedLeague, setSelectedLeague] = useState<LeagueFilterValue>('Toutes')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const { matches, loading, error, refetch } = useMatches()

  const filteredMatches = useMemo(() => {
    if (selectedLeague === 'Toutes') {
      return matches
    }

    return matches.filter((match) => match.league === selectedLeague)
  }, [matches, selectedLeague])

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const handleDevRefresh = async () => {
    setSyncLoading(true)
    setSyncMessage(null)

    try {
      const response = await syncTodayMatches()
      await refetch()
      setSyncMessage(response.data.detail || 'Données synchronisées.')
    } catch (syncError) {
      if (axios.isAxiosError(syncError) && typeof syncError.response?.data?.detail === 'string') {
        setSyncMessage(syncError.response.data.detail)
      } else {
        setSyncMessage('La synchronisation a échoué.')
      }
    } finally {
      setSyncLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_30%),linear-gradient(180deg,_rgba(19,27,46,0.98),_rgba(11,19,38,1))] px-6 py-8 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.75)] ring-1 ring-white/5 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-300/90">
                Matchs du jour
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.02em] text-slate-50 sm:text-5xl">
                Le football du jour,
                <span className="block text-blue-400">sans quitter MatchNote.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                Suivez les affiches des cinq grands championnats, filtrez rapidement par ligue
                et préparez vos notes, commentaires et pronostics.
              </p>
            </div>

            
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Aujourd&apos;hui</p>
              <p className="text-xl font-semibold text-slate-100">{formattedDate}</p>
              
            
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <LeagueFilter
              selectedLeague={selectedLeague}
              onSelectLeague={setSelectedLeague}
            />

            {isDev && (
              <button
                type="button"
                onClick={handleDevRefresh}
                disabled={syncLoading}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-blue-300 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.8)] ring-1 ring-white/5 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncLoading ? 'Synchronisation en cours...' : 'Rafraîchir les scores (dev)'}
              </button>
            )}
          </div>

          {syncMessage && (
            <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300 ring-1 ring-white/5">
              {syncMessage}
            </div>
          )}
        </section>

        {loading ? (
          <Loader label="Chargement des matchs du jour..." />
        ) : error ? (
          <div className="rounded-[2rem] bg-red-500/10 px-6 py-8 text-center ring-1 ring-red-400/20">
            <p className="text-lg font-semibold text-red-300">Impossible de charger les matchs</p>
            <p className="mt-2 text-sm text-red-200/80">{error}</p>
          </div>
        ) : (
          <MatchList matches={filteredMatches} />
        )}
      </div>
    </div>
  )
}

export default Home
