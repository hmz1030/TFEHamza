import { useEffect, useMemo, useState } from 'react'
import CommentSummaryCard from '../components/comment/CommentSummaryCard'
import { useParams } from 'react-router-dom'
import PronosticSummaryCard from '../components/pronostic/PronosticSummaryCard'
import FollowButton from '../components/user/FollowButton'
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
  const matchById = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches],
  )

  const handleFollowChange = (isFollowing: boolean) => {
    setUser((current) => {
      if (!current) return current

      return {
        ...current,
        is_following: isFollowing,
        followers_count: Math.max(0, current.followers_count + (isFollowing ? 1 : -1)),
      }
    })
  }

  if (loading) return <Loader label="Chargement du profil..." />
  if (error || !user) return <div className="px-4 py-10 text-center text-[var(--danger)]">{error || 'Profil introuvable.'}</div>

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Profil utilisateur</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">{user.username}</h1>
              <div className="mt-4">
                <UserBadge badge={user.badge} />
              </div>
            </div>
            <FollowButton
              userId={user.id}
              initialFollowing={user.is_following}
              isFollowedBy={user.is_followed_by}
              onChange={handleFollowChange}
            />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-7">
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Abonnés</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{user.followers_count}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Abonnements</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{user.following_count}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Notes</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.ratings.length ?? 0}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Votes MVP</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.votes.length ?? 0}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Commentaires</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.comments.length ?? 0}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Pronostics</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.pronostics.length ?? 0}</p></article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5"><p className="text-sm text-[var(--muted)]">Points</p><p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{totalPoints}</p></article>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Commentaires récents</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Ses réactions sur les matchs.</p>
          </div>

          <div className="space-y-4">
            {activity?.comments.length ? activity.comments.map((comment) => (
              <CommentSummaryCard key={comment.id} comment={comment} match={matchById.get(comment.match)} title={`${user.username} a commenté`} />
            )) : (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun commentaire visible pour le moment.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Pronostics récents</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Retrouve ses derniers scores joués et les résultats des matchs.</p>
          </div>

          <div className="space-y-4">
            {activity?.pronostics.length ? activity.pronostics.map((pronostic) => (
              <PronosticSummaryCard
                key={pronostic.id}
                pronostic={pronostic}
                match={matchById.get(pronostic.match)}
                title={`${user.username} a joué`}
              />
            )) : (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun pronostic visible pour le moment.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserPublic
