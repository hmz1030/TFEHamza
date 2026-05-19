import { useMemo, useState } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import LeagueFilter, { type LeagueFilterValue } from '../components/match/LeagueFilter'
import MatchList from '../components/match/MatchList'
import HomeSearchPanel from '../components/search/HomeSearchPanel'
import { useMatches } from '../hooks/useMatches'
import { syncTodayMatches } from '../services/matchService'
import { devToolsEnabled } from '../utils/devTools'
import stadeHero from '../assets/stade.png'

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

function isValidInputDate(date: string | null) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function Home() {
  const today = useMemo(() => formatDateForInput(new Date()), [])
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedLeague, setSelectedLeague] = useState<LeagueFilterValue>('Toutes')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const selectedDate = isValidInputDate(searchParams.get('date'))
    ? searchParams.get('date')!
    : today
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
    const nextParams = new URLSearchParams(searchParams)
    if (nextDate === today) {
      nextParams.delete('date')
    } else {
      nextParams.set('date', nextDate)
    }
    setSearchParams(nextParams)
    setSyncMessage(null)
  }

  const handleDevRefresh = async () => {
    setSyncLoading(true)
    setSyncMessage(null)

    try {
      const response = await syncTodayMatches(selectedDate)
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
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section
          className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] bg-cover bg-center shadow-[var(--shadow)]"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(7,12,19,0.54) 0%, rgba(7,12,19,0.7) 44%, rgba(7,12,19,0.92) 100%), url(${stadeHero})`,
          }}
        >
          <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.6fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[var(--accent-strong)]">
                {isToday ? 'Sélection du jour' : 'Archives de match'}
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl font-bold text-[var(--text)] sm:text-5xl lg:text-6xl">
                Note ton Football
              </h1>
            
            </div>

            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(7,12,19,0.64)] p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                {isToday ? "Aujourd'hui" : 'Date sélectionnée'}
              </p>
              <p className="mt-3 text-2xl font-semibold capitalize text-[var(--text)]">{formattedDate}</p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDateChange(shiftInputDate(selectedDate, -1))}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-lg font-semibold text-[var(--text)] transition hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.06)]"
                  aria-label="Jour précédent"
                >
                  {'<'}
                </button>

                <label className="flex-1">
                  <span className="sr-only">Choisir une date</span>
                  <input
                    type="date"
                    lang="fr-BE"
                    value={selectedDate}
                    onChange={(event) => handleDateChange(event.target.value)}
                    className="w-full rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleDateChange(shiftInputDate(selectedDate, 1))}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-lg font-semibold text-[var(--text)] transition hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.06)]"
                  aria-label="Jour suivant"
                >
                  {'>'}
                </button>
              </div>

              <div className="mt-4 flex justify-start">
                <button
                  type="button"
                  onClick={() => handleDateChange(today)}
                  disabled={isToday}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Revenir à aujourd&apos;hui
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <LeagueFilter selectedLeague={selectedLeague} onSelectLeague={setSelectedLeague} />

            <div className="flex flex-col gap-3 lg:items-end">
              {devToolsEnabled ? (
                <button
                  type="button"
                  onClick={handleDevRefresh}
                  disabled={syncLoading}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--line-strong)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {syncLoading
                    ? 'Synchronisation en cours...'
                    : `Synchron boutton dev`}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-[var(--muted-strong)] transition hover:border-[var(--accent-strong)] hover:text-[var(--text)]"
                aria-label="Ouvrir la recherche"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Zm5.2-1.6 4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {syncMessage ? (
            <div className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] px-4 py-3 text-sm text-[var(--muted-strong)]">
              {syncMessage}
            </div>
          ) : null}
        </section>

        {loading ? (
          <Loader label={`Chargement des matchs du ${selectedDate}...`} />
        ) : error ? (
          <div className="rounded-[1.8rem] border border-[rgba(216,125,116,0.26)] bg-[rgba(216,125,116,0.08)] px-6 py-8 text-center">
            <p className="text-lg font-semibold text-[var(--text)]">Impossible de charger les matchs</p>
            <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
          </div>
        ) : (
          <MatchList matches={filteredMatches} />
        )}
      </div>
      {searchOpen ? (
        <HomeSearchPanel
          onClose={() => setSearchOpen(false)}
          onSelectLeague={setSelectedLeague}
        />
      ) : null}
    </div>
  )
}

export default Home
