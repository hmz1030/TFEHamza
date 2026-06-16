import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Comment, CommentReactionResult, Rating } from '../../types'
import { getCommentReplies } from '../../services/commentService'
import RatingReportButton from '../rating/RatingReportButton'
import RatingShareActions from '../rating/RatingShare'
import UserAvatar from '../user/UserAvatar'
import UserProfileLink from '../user/UserProfileLink'
import CommentForm from './CommentForm'
import CommentReactionButtons from './CommentReactionButtons'
import CommentReportButton from './CommentReportButton'
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
const INITIAL_REPLY_LIMIT = 2
const REPLY_LOAD_STEP = 3

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

function ReplyIcon() {
  return (
    <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5h9M5 9h5m8-8H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4l3.5 4 3.5-4h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" />
    </svg>
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
  const [loadedRepliesByParent, setLoadedRepliesByParent] = useState<Record<number, Comment[]>>({})
  const [repliesHasMoreByParent, setRepliesHasMoreByParent] = useState<Record<number, boolean>>({})
  const [loadingRepliesByParent, setLoadingRepliesByParent] = useState<Record<number, boolean>>({})
  const focusedCommentId = Number(searchParams.get('comment'))
  const focusedRatingId = Number(searchParams.get('rating'))

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

  const getVisibleReplies = (parentId: number) => {
    const initialReplies = (repliesByParent.get(parentId) ?? []).slice(0, INITIAL_REPLY_LIMIT)
    const extraReplies = loadedRepliesByParent[parentId] ?? []
    const seenReplyIds = new Set<number>()

    return [...initialReplies, ...extraReplies].filter((reply) => {
      if (seenReplyIds.has(reply.id)) return false
      seenReplyIds.add(reply.id)
      return true
    })
  }

  const focusedFeedIndex = useMemo(() => {
    if (!focusedCommentId && !focusedRatingId) return -1

    return feed.findIndex((item) => {
      if (item.type === 'rating') return item.rating.id === focusedRatingId
      if (item.type !== 'comment') return false
      if (item.comment.id === focusedCommentId) return true

      return getVisibleReplies(item.comment.id).some((reply) => reply.id === focusedCommentId)
    })
  }, [feed, focusedCommentId, focusedRatingId, loadedRepliesByParent, repliesByParent])

  useEffect(() => {
    const targetId = focusedRatingId ? `rating-${focusedRatingId}` : focusedCommentId ? `comment-${focusedCommentId}` : null
    if (!targetId) return
    const target = document.getElementById(targetId)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [comments, focusedCommentId, focusedRatingId, loadedRepliesByParent, ratings, visibleCount])

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ITEMS)
    setLoadedRepliesByParent({})
    setRepliesHasMoreByParent({})
    setLoadingRepliesByParent({})
  }, [matchId])

  useEffect(() => {
    if (focusedFeedIndex < 0) return

    setVisibleCount((current) => Math.max(current, Math.min(feed.length, focusedFeedIndex + 1)))
  }, [feed.length, focusedFeedIndex])

  const visibleFeed = feed.slice(0, visibleCount)
  const itemSeparatorClass = 'after:absolute after:bottom-0 after:left-5 after:right-5 after:h-px after:bg-[rgba(232,227,217,0.10)]'

  const shouldShowMoreReplies = (comment: Comment, visibleRepliesCount: number) => {
    const knownHasMore = repliesHasMoreByParent[comment.id]
    if (knownHasMore !== undefined) return knownHasMore
    return comment.replies_count > visibleRepliesCount
  }

  const handleLoadMoreReplies = async (parentId: number) => {
    if (loadingRepliesByParent[parentId]) return

    const offset = getVisibleReplies(parentId).length
    setLoadingRepliesByParent((current) => ({ ...current, [parentId]: true }))

    try {
      const response = await getCommentReplies(parentId, REPLY_LOAD_STEP, offset)
      const newReplies = response.data.results

      setLoadedRepliesByParent((current) => {
        const existingReplies = current[parentId] ?? []
        const existingIds = new Set(existingReplies.map((reply) => reply.id))
        const uniqueNewReplies = newReplies.filter((reply) => !existingIds.has(reply.id))

        return {
          ...current,
          [parentId]: [...existingReplies, ...uniqueNewReplies],
        }
      })
      setRepliesHasMoreByParent((current) => ({ ...current, [parentId]: response.data.has_more }))
    } finally {
      setLoadingRepliesByParent((current) => ({ ...current, [parentId]: false }))
    }
  }

  const renderReply = (reply: Comment) => (
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
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CommentShareActions comment={reply} matchLabel={matchLabel} className="" />
        <CommentReportButton commentId={reply.id} />
      </div>
    </div>
  )

  const renderComment = (comment: Comment, withSeparator: boolean) => {
    const visibleReplies = getVisibleReplies(comment.id)
    const hasMoreReplies = shouldShowMoreReplies(comment, visibleReplies.length)
    const loadingReplies = Boolean(loadingRepliesByParent[comment.id])

    return (
      <article
        key={`comment-${comment.id}`}
        id={`comment-${comment.id}`}
        className={`relative px-5 py-5 transition ${withSeparator ? itemSeparatorClass : ''} ${focusedCommentId === comment.id ? 'bg-[rgba(200,132,73,0.08)]' : ''}`}
      >
        <div className="flex items-start justify-between gap-4">
          <UserLine userId={comment.user} username={comment.user_username} avatarUrl={comment.user_avatar_url} date={comment.created_at} />
          <button
            type="button"
            onClick={() => setReplyingTo((current) => current === comment.id ? null : comment.id)}
            className="text-action-button"
            title="Repondre"
            aria-label="Repondre a ce commentaire"
          >
            <ReplyIcon />
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">{comment.content}</p>
        <CommentReactionButtons
          commentId={comment.id}
          likesCount={comment.likes_count}
          dislikesCount={comment.dislikes_count}
          myReaction={comment.my_reaction}
          onUpdated={onReactionUpdated}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CommentShareActions comment={comment} matchLabel={matchLabel} className="" />
          <CommentReportButton commentId={comment.id} />
        </div>

        {replyingTo === comment.id ? (
          <div className="mt-4">
            <CommentForm matchId={matchId} parentId={comment.id} placeholder="Ta reponse" buttonLabel="Repondre" onCreated={onCreated} />
          </div>
        ) : null}

        {visibleReplies.map(renderReply)}

        {hasMoreReplies ? (
          <button
            type="button"
            onClick={() => void handleLoadMoreReplies(comment.id)}
            disabled={loadingReplies}
            className="text-action-button mt-4 text-xs"
          >
            {loadingReplies ? 'Chargement...' : 'Voir plus de reponses'}
          </button>
        ) : null}
      </article>
    )
  }

  const renderRating = (rating: Rating, withSeparator: boolean) => (
    <article
      key={`rating-${rating.id}`}
      id={`rating-${rating.id}`}
      className={`relative px-5 py-5 transition ${withSeparator ? itemSeparatorClass : ''} ${focusedRatingId === rating.id ? 'bg-[rgba(200,132,73,0.08)]' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <UserLine userId={rating.user} username={rating.user_username} avatarUrl={rating.user_avatar_url} date={rating.created_at} />
        <span className="rounded-full border border-[rgba(200,132,73,0.3)] bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-bold text-[var(--accent-strong)]">
          Note {rating.score}/10
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">
        {rating.comment.trim() || 'Note envoyee sans commentaire.'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {rating.comment.trim().length > 0 ? (
          <RatingReportButton ratingId={rating.id} />
        ) : null}
        <RatingShareActions rating={rating} matchLabel={matchLabel} className="mt-4" />
      </div>
    </article>
  )

  if (feed.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
        Aucun commentaire pour le moment.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)]">
      {visibleFeed.map((item, index) => {
        const withSeparator = index < visibleFeed.length - 1
        return item.type === 'rating' ? renderRating(item.rating, withSeparator) : renderComment(item.comment, withSeparator)
      })}

      {visibleCount < feed.length ? (
        <div className="relative flex justify-center px-5 py-4 before:absolute before:left-5 before:right-5 before:top-0 before:h-px before:bg-[rgba(232,227,217,0.10)]">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(feed.length, current + FEED_LOAD_STEP))}
            className="text-action-button text-sm"
          >
            Charger plus
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default DiscussionFeed
