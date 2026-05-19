import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import CommentSummaryCard from '../components/comment/CommentSummaryCard'
import PronosticSummaryCard from '../components/pronostic/PronosticSummaryCard'
import RatingSummaryCard from '../components/rating/RatingSummaryCard'
import FollowButton from '../components/user/FollowButton'
import FollowStats from '../components/user/FollowStats'
import UserAvatar from '../components/user/UserAvatar'
import UserBadge from '../components/user/UserBadge'
import VoteSummaryCard from '../components/vote/VoteSummaryCard'
import Loader from '../components/ui/Loader'
import type { ActivityData } from '../services/userService'
import { getMatches } from '../services/matchService'
import { getUser, getUserActivity } from '../services/userService'
import type { Match, PublicUser } from '../types'
import { resolveCachedData, setCachedData } from '../utils/requestCache'

type PublicActivityTab = 'ratings' | 'votes' | 'comments' | 'pronostics'

function UserPublic() {
  const { id } = useParams()
  const userId = Number(id)
  const [user, setUser] = useState<PublicUser | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<PublicActivityTab | null>(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    setActiveTab(null)
    Promise.all([
      resolveCachedData(`user:${userId}:detail`, async () => (await getUser(userId)).data),
      resolveCachedData(`user:${userId}:activity`, async () => (await getUserActivity(userId)).data),
      resolveCachedData('matches:list', async () => (await getMatches()).data),
    ])
      .then(([userData, activityData, matchesData]) => {
        setUser(userData)
        setActivity(activityData)
        setMatches(matchesData)
      })
      .catch(() => setError('Impossible de charger ce profil.'))
      .finally(() => setLoading(false))
  }, [userId])

  const totalPoints = useMemo(
    () => activity?.pronostics.reduce((sum, pronostic) => sum + (pronostic.points ?? 0), 0) ?? 0,
    [activity],
  )
  const notesCount = activity?.ratings.length ?? 0

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
    if (user) {
      setCachedData(`user:${userId}:detail`, {
        ...user,
        is_following: isFollowing,
        followers_count: Math.max(0, user.followers_count + (isFollowing ? 1 : -1)),
      })
    }
  }

  const statCards: { key: PublicActivityTab; label: string; value: number }[] = [
    { key: 'ratings', label: 'Notes', value: notesCount },
    { key: 'votes', label: 'Votes MVP', value: activity?.votes.length ?? 0 },
    { key: 'comments', label: 'Commentaires', value: activity?.comments.length ?? 0 },
    { key: 'pronostics', label: 'Points', value: totalPoints },
  ]

  if (loading) return <Loader label="Chargement du profil..." />

  if (error || !user) {
    return (
      <div className="px-4 py-10 text-center text-[var(--danger)]">
        {error || 'Profil introuvable.'}
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Profil utilisateur</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="lg" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">{user.username}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <UserBadge badge={user.badge} variant="profile" />
                  <FollowStats followersCount={user.followers_count} followingCount={user.following_count} />
                </div>
              </div>
            </div>
            <FollowButton
              userId={user.id}
              initialFollowing={user.is_following}
              isFollowedBy={user.is_followed_by}
              onChange={handleFollowChange}
            />
          </div>
          {user.bio ? (
            <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">{user.bio}</p>
          ) : (
            <p className="mt-5 text-sm text-[var(--muted)]">Aucune biographie pour le moment.</p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-4">
          {statCards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => setActiveTab((current) => current === card.key ? null : card.key)}
              className={`rounded-[1.6rem] border p-5 text-left transition ${activeTab === card.key ? 'border-[var(--accent-strong)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[rgba(17,27,40,0.72)] hover:border-[var(--accent-strong)]'}`}
            >
              <p className="text-sm text-[var(--muted)]">{card.label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{card.value}</p>
            </button>
          ))}
        </section>

        {activeTab === 'ratings' ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Notes recentes</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Ses derniers matchs notes.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activity?.ratings.length ? activity.ratings.map((rating) => (
              <RatingSummaryCard key={rating.id} rating={rating} match={matchById.get(rating.match)} />
            )) : (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)] md:col-span-2">
                Aucune note visible pour le moment.
              </div>
            )}
          </div>
        </section>
        ) : null}

        {activeTab === 'votes' ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Votes MVP</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Les joueurs qu'il a elus homme du match.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activity?.votes.length ? activity.votes.map((vote) => (
              <VoteSummaryCard key={vote.id} vote={vote} match={matchById.get(vote.match)} />
            )) : (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)] sm:col-span-2 lg:col-span-4">
                Aucun vote MVP visible pour le moment.
              </div>
            )}
          </div>
        </section>
        ) : null}

        {activeTab === 'comments' ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Commentaires recents</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Ses reactions sur les matchs.</p>
          </div>

          <div className="space-y-4">
            {activity?.comments.length ? activity.comments.map((comment) => (
              <CommentSummaryCard
                key={comment.id}
                comment={comment}
                match={matchById.get(comment.match)}
                title={`${user.username} a commente`}
              />
            )) : (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun commentaire visible pour le moment.
              </div>
            )}
          </div>
        </section>
        ) : null}

        {activeTab === 'pronostics' ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Pronostics recents</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Retrouve ses derniers scores joues et les resultats des matchs.</p>
          </div>

          <div className="space-y-4">
            {activity?.pronostics.length ? activity.pronostics.map((pronostic) => (
              <PronosticSummaryCard
                key={pronostic.id}
                pronostic={pronostic}
                match={matchById.get(pronostic.match)}
                title={`${user.username} a joue`}
              />
            )) : (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun pronostic visible pour le moment.
              </div>
            )}
          </div>
        </section>
        ) : null}
      </div>
    </div>
  )
}

export default UserPublic
