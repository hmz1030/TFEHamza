import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorMessage from '../components/ui/ErrorMessage'
import Loader from '../components/ui/Loader'
import UserAvatar from '../components/user/UserAvatar'
import UserBadge from '../components/user/UserBadge'
import { getFriendsFeed, type FriendsFeedItem } from '../services/userService'
import type { Match } from '../types'

const FEED_LIMIT = 8

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatMatchDate(match: Match) {
  return new Intl.DateTimeFormat('fr-BE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(match.date))
}

function MatchPreview({ match }: { match: Match }) {
  return (
    <div className="mt-4 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{match.league}</p>
          <p className="mt-1 text-sm text-[var(--muted-strong)]">{formatMatchDate(match)}</p>
        </div>
        <div className="flex items-center gap-3 text-right text-sm font-bold text-[var(--text)]">
          <TeamMiniLogo logo={match.home_team.logo} name={match.home_team.name} />
          <span>{match.home_team.name}</span>
          <span className="rounded-md bg-[rgba(255,255,255,0.07)] px-2 py-1 text-xs text-[var(--muted-strong)]">
            vs
          </span>
          <span>{match.away_team.name}</span>
          <TeamMiniLogo logo={match.away_team.logo} name={match.away_team.name} />
        </div>
      </div>
    </div>
  )
}

function TeamMiniLogo({ logo, name }: { logo: string; name: string }) {
  if (!logo) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--line)] bg-white/[0.04] text-[0.65rem] font-black">
        {name.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={logo}
      alt=""
      className="h-8 w-8 rounded-md bg-white object-contain p-1"
      loading="lazy"
    />
  )
}

function FeedCard({ item }: { item: FriendsFeedItem }) {
  const isRating = item.type === 'rating'
  const actionLabel = isRating ? 'a note un match' : 'a commente un match'
  const content = isRating
    ? item.rating.comment.trim() || 'Note envoyee sans commentaire.'
    : item.comment.content
  const target = item.type === 'comment'
    ? `/matches/${item.match.id}?comment=${item.comment.id}#comment-${item.comment.id}`
    : `/matches/${item.match.id}`

  return (
    <article className="rounded-xl border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={`/users/${item.user.id}`} className="shrink-0">
            <UserAvatar username={item.user.username} avatarUrl={item.user.avatar_url} size="sm" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/users/${item.user.id}`}
                className="font-black text-[var(--text)] transition hover:text-[var(--accent-strong)]"
              >
                {item.user.username}
              </Link>
              <span className="text-sm text-[var(--muted)]">{actionLabel}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <UserBadge badge={item.user.badge} />
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {formatDate(item.created_at)}
              </span>
            </div>
          </div>
        </div>

        {isRating ? (
          <span className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-black text-[var(--bg-deep)]">
            {item.rating.score}/10
          </span>
        ) : (
          <span className="rounded-md border border-[var(--line)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            Commentaire
          </span>
        )}
      </div>

      <Link to={target} className="group mt-4 block">
        <p className="line-clamp-3 text-sm leading-6 text-[var(--muted-strong)] transition group-hover:text-[var(--text)]">
          {content}
        </p>
        <MatchPreview match={item.match} />
      </Link>

      {!isRating ? (
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[var(--muted)]">
          <span>{item.comment.likes_count} like{item.comment.likes_count > 1 ? 's' : ''}</span>
          <span>{item.comment.dislikes_count} dislike{item.comment.dislikes_count > 1 ? 's' : ''}</span>
        </div>
      ) : null}
    </article>
  )
}

function Friends() {
  const [items, setItems] = useState<FriendsFeedItem[]>([])
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')
    getFriendsFeed(0, FEED_LIMIT)
      .then((response) => {
        if (!active) return
        setItems(response.data.results)
        setNextOffset(response.data.next_offset)
        setHasMore(response.data.has_more)
      })
      .catch(() => {
        if (active) setError("Impossible de charger le fil d'amis.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    setError('')

    try {
      const response = await getFriendsFeed(nextOffset, FEED_LIMIT)
      setItems((current) => [...current, ...response.data.results])
      setNextOffset(response.data.next_offset)
      setHasMore(response.data.has_more)
    } catch {
      setError("Impossible de charger plus d'activites.")
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) return <Loader label="Chargement du fil d'amis..." />

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Ami</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[var(--text)]">Fil d'amis</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Retrouve les notes et commentaires les plus recents des utilisateurs que tu suis.
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-md border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent-strong)] hover:text-[var(--text)]"
            >
              Voir mon profil
            </Link>
          </div>
        </section>

        <ErrorMessage message={error} />

        {items.length === 0 ? (
          <section className="rounded-xl border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-8 text-center">
            <p className="text-xl font-black text-[var(--text)]">Ton fil est encore vide.</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Suis quelques utilisateurs depuis leur profil public pour voir leurs notes et commentaires ici.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}

            {hasMore ? (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-action-button text-sm"
                >
                  {loadingMore ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  )
}

export default Friends
