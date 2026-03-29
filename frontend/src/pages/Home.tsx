import { useMemo, useState } from 'react'
import axios from 'axios'
import Loader from '../components/ui/Loader'
import LeagueFilter, { type LeagueFilterValue } from '../components/match/LeagueFilter'
import MatchList from '../components/match/MatchList'
import { useMatches } from '../hooks/useMatches'
import { syncTodayMatches } from '../services/matchService'

const isDev = import.meta.env.DEV

function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function shiftInputDate(date: string, days: number) {
  const nextDate = new Date(`${date}T12:00:00`)
  nextDate.setDate(nextDate.getDate() + days)

  return formatDateForInput(nextDate)
}

function Home() {
  const today = useMemo(() => formatDateForInput(new Date()), [])
  const [selectedLeague, setSelectedLeague] = useState<LeagueFilterValue>('Toutes')
  const [selectedDate, setSelectedDate] = useState(today)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const { matches, loading, error, refetch } = useMatches(selectedDate)

  const filteredMatches = useMemo(() => {
    if (selectedLeague === 'Toutes') {
      return matches
    }

    return matches.filter((match) => match.league === selectedLeague)
  }, [matches, selectedLeague])

  const formattedDate = useMemo(() => formatDisplayDate(selectedDate), [selectedDate])
  const isToday = selectedDate === today

  const handleDateChange = (nextDate: string) => {
    setSelectedDate(nextDate)
    setSyncMessage(null)
  }

  const handleDevRefresh = async () => {
    setSyncLoading(true)
    setSyncMessage(null)

    try {
      const response = await syncTodayMatches(selectedDate)
      await refetch()
      setSyncMessage(response.data.detail || 'Donnees synchronisees.')
    } catch (syncError) {
      if (axios.isAxiosError(syncError) && typeof syncError.response?.data?.detail === 'string') {
        setSyncMessage(syncError.response.data.detail)
      } else {
        setSyncMessage('La synchronisation a echoue.')
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
                {isToday ? 'Matchs du jour' : 'Matchs'}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.02em] text-slate-50 sm:text-5xl">
                Le football,
                <span className="block text-blue-400">quand tu veux.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                Choisis une date et retrouve les matchs disponibles.
              </p>
            </div>

            <div className="w-full max-w-sm rounded-[1.75rem] bg-slate-950/45 p-5 shadow-[0_18px_42px_-22px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {isToday ? "Aujourd'hui" : 'Date selectionnee'}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-100">{formattedDate}</p>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDateChange(shiftInputDate(selectedDate, -1))}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-800"
                  aria-label="Jour precedent"
                >
                  {'<'}
                </button>

                <label className="flex-1">
                  <span className="sr-only">Choisir une date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => handleDateChange(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleDateChange(shiftInputDate(selectedDate, 1))}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-800"
                  aria-label="Jour suivant"
                >
                  {'>'}
                </button>
              </div>

              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleDateChange(today)}
                  disabled={isToday}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Aujourd&apos;hui
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <LeagueFilter selectedLeague={selectedLeague} onSelectLeague={setSelectedLeague} />

            {isDev && (
              <button
                type="button"
                onClick={handleDevRefresh}
                disabled={syncLoading}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-blue-300 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.8)] ring-1 ring-white/5 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncLoading
                  ? 'Synchronisation en cours...'
                  : `Synchroniser le ${selectedDate} (dev)`}
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
          <Loader label={`Chargement des matchs du ${selectedDate}...`} />
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
