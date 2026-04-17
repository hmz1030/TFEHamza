import { useEffect, useState } from 'react'
import FavoriteClubCard from '../components/user/FavoriteClubCard'
import UserBadge from '../components/user/UserBadge'
import Loader from '../components/ui/Loader'
import { useAuth } from '../context/AuthContext'
import { getFavoriteClubs, getMyActivity, removeFavoriteClub, type ActivityData, type FavoriteClub } from '../services/userService'

function Profile() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteClub[]>([])
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
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
      </div>
    </div>
  )
}

export default Profile
