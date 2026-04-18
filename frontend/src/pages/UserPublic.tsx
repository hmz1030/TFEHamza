import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import PronosticSummaryCard from '../components/pronostic/PronosticSummaryCard'
import UserBadge from '../components/user/UserBadge'
import Loader from '../components/ui/Loader'
import type { ActivityData } from '../services/userService'
import { getMatches } from '../services/matchService'
import { getUser, getUserActivity } from '../services/userService'
import type { Match, PublicUser } from '../types'

function UserPublic() {
  const { id } = useParams()
  const userId = Number(id)
  const [user, setUser] = useState<PublicUser | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getUser(userId), getUserActivity(userId), getMatches()])
      .then(([userResponse, activityResponse, matchesResponse]) => {
        setUser(userResponse.data)
        setActivity(activityResponse.data)
        setMatches(matchesResponse.data)
      })
      .catch(() => setError("Impossible de charger ce profil."))
      .finally(() => setLoading(false))
  }, [userId])

  const totalPoints = useMemo(
    () => activity?.pronostics.reduce((sum, pronostic) => sum + (pronostic.points ?? 0), 0) ?? 0,
    [activity],
  )

  if (loading) return <Loader label="Chargement du profil..." />
  if (error || !user) return <div className="px-4 py-10 text-center text-[var(--danger)]">{error || 'Profil introuvable.'}</div>

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Profil utilisateur</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--text)]">{user.username}</h1>
          <div className="mt-4">
            <UserBadge badge={user.badge} />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Notes</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.ratings.length ?? 0}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Votes MVP</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.votes.length ?? 0}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Pronostics</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.pronostics.length ?? 0}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Points</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{totalPoints}</p></article>
        </section>
      </div>
    </div>
  )
}

export default UserPublic
