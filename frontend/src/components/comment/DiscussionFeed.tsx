import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Comment, CommentReactionResult, Rating } from '../../types'
import UserAvatar from '../user/UserAvatar'
import UserProfileLink from '../user/UserProfileLink'
import CommentForm from './CommentForm'
import CommentReactionButtons from './CommentReactionButtons'
import CommentShareActions from './CommentShareActions'

interface DiscussionFeedProps {
  matchId: number
  comments: Comment[]
  ratings: Rating[]
  matchLabel?: string
  onCreated?: () => Promise<void> | void
  onReactionUpdated?: (payload: CommentReactionResult) => void
}

type FeedItem =
  | { type: 'comment'; date: string; comment: Comment }
  | { type: 'rating'; date: string; rating: Rating }

const INITIAL_VISIBLE_ITEMS = 3
const FEED_LOAD_STEP = 10

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function UserLine({ userId, username, avatarUrl, date }: { userId: number; username: string; avatarUrl?: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar username={username} avatarUrl={avatarUrl} size="sm" />
      <div>
        <UserProfileLink userId={userId} className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">
          {username}
        </UserProfileLink>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{formatDate(date)}</p>
      </div>
    </div>
  )
}

function DiscussionFeed({
  matchId,
  comments,
  ratings,
  matchLabel,
  onCreated,
  onReactionUpdated,
}: DiscussionFeedProps) {
  const [searchParams] = useSearchParams()
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS)
  const focusedCommentId = Number(searchParams.get('comment'))

  useEffect(() => {
    if (!focusedCommentId) return
    const target = document.getElementById(`comment-${focusedCommentId}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [comments, focusedCommentId, visibleCount])

  const repliesByParent = useMemo(() => {
    const replies = new Map<number, Comment[]>()

    comments.filter((comment) => comment.parent).forEach((reply) => {
      const parentId = reply.parent!
      replies.set(parentId, [...(replies.get(parentId) ?? []), reply])
    })

    return replies
  }, [comments])

  const feed: FeedItem[] = useMemo(() => [
    ...comments.filter((comment) => !comment.parent).map((comment) => ({
      type: 'comment' as const,
      date: comment.created_at,
      comment,
    })),
    ...ratings.map((rating) => ({
      type: 'rating' as const,
      date: rating.created_at,
      rating,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [comments, ratings])

  const focusedFeedIndex = useMemo(() => {
    if (!focusedCommentId) return -1

    return feed.findIndex((item) => {
      if (item.type !== 'comment') return false
      if (item.comment.id === focusedCommentId) return true

      return (repliesByParent.get(item.comment.id) ?? []).some((reply) => reply.id === focusedCommentId)
    })
  }, [feed, focusedCommentId, repliesByParent])

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ITEMS)
  }, [matchId])

  useEffect(() => {
    if (focusedFeedIndex < 0) return

    setVisibleCount((current) => Math.max(current, Math.min(feed.length, focusedFeedIndex + 1)))
  }, [feed.length, focusedFeedIndex])

  const visibleFeed = feed.slice(0, visibleCount)

  if (feed.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
        Aucun commentaire pour le moment.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visibleFeed.map((item) => item.type === 'rating' ? (
        <article key={`rating-${item.rating.id}`} className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
          <div className="flex items-start justify-between gap-4">
            <UserLine userId={item.rating.user} username={item.rating.user_username} avatarUrl={item.rating.user_avatar_url} date={item.rating.created_at} />
            <span className="rounded-full border border-[rgba(200,132,73,0.3)] bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-bold text-[var(--accent-strong)]">
              Note {item.rating.score}/10
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">
            {item.rating.comment.trim() || 'Note envoyee sans commentaire.'}
          </p>
        </article>
      ) : (
        <article key={`comment-${item.comment.id}`} id={`comment-${item.comment.id}`} className={`rounded-[1.6rem] border bg-[rgba(17,27,40,0.72)] p-5 transition ${focusedCommentId === item.comment.id ? 'border-[var(--accent-strong)] shadow-[0_0_0_1px_var(--accent-strong)]' : 'border-[var(--line)]'}`}>
          <div className="flex items-start justify-between gap-4">
            <UserLine userId={item.comment.user} username={item.comment.user_username} avatarUrl={item.comment.user_avatar_url} date={item.comment.created_at} />
            <button type="button" onClick={() => setReplyingTo((current) => current === item.comment.id ? null : item.comment.id)} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]">
              Répondre
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">{item.comment.content}</p>
          <CommentReactionButtons
            commentId={item.comment.id}
            likesCount={item.comment.likes_count}
            dislikesCount={item.comment.dislikes_count}
            myReaction={item.comment.my_reaction}
            onUpdated={onReactionUpdated}
          />
          <CommentShareActions comment={item.comment} matchLabel={matchLabel} />

          {replyingTo === item.comment.id ? (
            <div className="mt-4">
              <CommentForm matchId={matchId} parentId={item.comment.id} placeholder="Ta réponse" buttonLabel="Répondre" onCreated={onCreated} />
            </div>
          ) : null}

          {(repliesByParent.get(item.comment.id) ?? []).map((reply) => (
            <div key={reply.id} id={`comment-${reply.id}`} className={`mt-4 border-l border-[var(--line)] pl-4 ${focusedCommentId === reply.id ? 'rounded-r-[1rem] bg-[rgba(200,132,73,0.08)] py-2' : ''}`}>
              <UserLine userId={reply.user} username={reply.user_username} avatarUrl={reply.user_avatar_url} date={reply.created_at} />
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{reply.content}</p>
              <CommentReactionButtons
                commentId={reply.id}
                likesCount={reply.likes_count}
                dislikesCount={reply.dislikes_count}
                myReaction={reply.my_reaction}
                onUpdated={onReactionUpdated}
              />
              <CommentShareActions comment={reply} matchLabel={matchLabel} />
            </div>
          ))}
        </article>
      ))}
      {visibleCount < feed.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(feed.length, current + FEED_LOAD_STEP))}
            className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]"
          >
            Charger plus
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default DiscussionFeed
