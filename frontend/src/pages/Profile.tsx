import { useEffect, useMemo, useState } from 'react'
import FavoriteClubCard from '../components/user/FavoriteClubCard'
import UserBadge from '../components/user/UserBadge'
import Loader from '../components/ui/Loader'
import { useAuth } from '../context/AuthContext'
import { getFavoriteClubs, getMyActivity, removeFavoriteClub, type ActivityData, type FavoriteClub } from '../services/userService'
import { getTeams } from '../services/teamService'
import type { Team } from '../types'

function Profile() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteClub[]>([])
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [addingFavorite, setAddingFavorite] = useState(false)
  const [showClubPicker, setShowClubPicker] = useState(false)
  const [teamQuery, setTeamQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ratings' | 'votes' | 'pronostics'>('ratings')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getFavoriteClubs(), getMyActivity()])
      .then(([favoritesResponse, activityResponse]) => {
        setFavorites(favoritesResponse.data)
        setActivity(activityResponse.data)
      })
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setLoading(false))
  }, [])

  const handleRemoveFavorite = async (teamId: number) => {
    await removeFavoriteClub(teamId)
    setFavorites((current) => current.filter((favorite) => favorite.team.id !== teamId))
  }

  if (!user) return null
  if (loading) return <Loader label="Chargement du profil..." />

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Mon profil</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--text)]">{user.username}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{user.email}</p>
          <div className="mt-4">
            <UserBadge badge={user.badge} />
          </div>
        </section>

        {error ? (
          <div className="rounded-[1.6rem] border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm text-[var(--muted)]">Notes</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.ratings.length ?? 0}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm text-[var(--muted)]">Votes MVP</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.votes.length ?? 0}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm text-[var(--muted)]">Pronostics</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.pronostics.length ?? 0}</p>
          </article>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Clubs favoris</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Retrouve les equipes que tu suis de pres.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {favorites.length === 0 ? (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun club favori pour le moment.
              </div>
            ) : favorites.map((favorite) => (
              <FavoriteClubCard key={favorite.id} favorite={favorite} onRemove={handleRemoveFavorite} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Activite recente</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Un apercu rapide de ce que tu as deja fait.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
              <p className="text-sm font-semibold text-[var(--muted-strong)]">Dernieres notes</p>
              <p className="mt-3 text-sm text-[var(--muted)]">{activity?.ratings.length ? `${activity.ratings.length} note(s) envoyee(s)` : 'Aucune note pour le moment.'}</p>
            </article>
            <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
              <p className="text-sm font-semibold text-[var(--muted-strong)]">Derniers votes</p>
              <p className="mt-3 text-sm text-[var(--muted)]">{activity?.votes.length ? `${activity.votes.length} vote(s) MVP enregistre(s)` : 'Aucun vote pour le moment.'}</p>
            </article>
            <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
              <p className="text-sm font-semibold text-[var(--muted-strong)]">Derniers pronostics</p>
              <p className="mt-3 text-sm text-[var(--muted)]">{activity?.pronostics.length ? `${activity.pronostics.length} pronostic(s) saisi(s)` : 'Aucun pronostic pour le moment.'}</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile
