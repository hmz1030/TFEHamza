import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MatchList from '../components/match/MatchList'
import FavoriteClubCard from '../components/user/FavoriteClubCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loader from '../components/ui/Loader'
import { getTodayMatches } from '../services/matchService'
import { getFavoriteClubs, type FavoriteClub } from '../services/userService'
import type { Match } from '../types'

function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteClub[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getFavoriteClubs(), getTodayMatches()])
      .then(([favoritesResponse, matchesResponse]) => {
        setFavorites(favoritesResponse.data)
        setMatches(matchesResponse.data)
      })
      .catch(() => setError('Impossible de charger tes favoris.'))
      .finally(() => setLoading(false))
  }, [])

  const favoriteMatches = useMemo(() => {
    const favoriteTeamIds = new Set(favorites.map((favorite) => favorite.team.id))

    return matches.filter((match) =>
      favoriteTeamIds.has(match.home_team.id) || favoriteTeamIds.has(match.away_team.id),
    )
  }, [favorites, matches])

  if (loading) return <Loader label="Chargement des favoris..." />

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Favoris</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Tes clubs du jour</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Les matchs affiches ici concernent uniquement tes clubs favoris aujourd'hui.
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-md border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent-strong)] hover:text-[var(--text)]"
            >
              Gerer mes clubs
            </Link>
          </div>
        </section>

        <ErrorMessage message={error} />

        {favorites.length === 0 ? (
          <EmptyState
            title="Aucun club favori"
            description="Ajoute des clubs depuis ton profil pour filtrer tes matchs."
          />
        ) : (
          <>
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text)]">Clubs suivis</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{favorites.length} club{favorites.length > 1 ? 's' : ''} dans tes favoris.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {favorites.map((favorite) => (
                  <FavoriteClubCard key={favorite.id} favorite={favorite} />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text)]">Matchs aujourd'hui</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {favoriteMatches.length} match{favoriteMatches.length > 1 ? 's' : ''} trouve{favoriteMatches.length > 1 ? 's' : ''}.
                </p>
              </div>

              {favoriteMatches.length === 0 ? (
                <EmptyState title="Aucun match aujourd'hui" description="Aucun de tes clubs favoris ne joue aujourd'hui." />
              ) : (
                <MatchList matches={favoriteMatches} />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default Favorites
