import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Comment, Rating } from '../../types'
import UserProfileLink from '../user/UserProfileLink'
import CommentForm from './CommentForm'
import CommentReactionButtons from './CommentReactionButtons'

interface DiscussionFeedProps {
  matchId: number
  comments: Comment[]
  ratings: Rating[]
  onCreated?: () => Promise<void> | void
}

type FeedItem =
  | { type: 'comment'; date: string; comment: Comment }
  | { type: 'rating'; date: string; rating: Rating }

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function DiscussionFeed({ matchId, comments, ratings, onCreated }: DiscussionFeedProps) {
  const [searchParams] = useSearchParams()
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const focusedCommentId = Number(searchParams.get('comment'))
  const handleReactionUpdated = () => onCreated?.()

  useEffect(() => {
    if (!focusedCommentId) return
    const target = document.getElementById(`comment-${focusedCommentId}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [comments, focusedCommentId])

  const repliesByParent = new Map<number, Comment[]>()
  comments.filter((comment) => comment.parent).forEach((reply) => {
    const parentId = reply.parent!
    repliesByParent.set(parentId, [...(repliesByParent.get(parentId) ?? []), reply])
  })

  const feed: FeedItem[] = [
    ...comments.filter((comment) => !comment.parent).map((comment) => ({
      type: 'comment' as const,
      date: comment.created_at,
      comment,
    })),
    ...ratings.filter((rating) => rating.comment.trim()).map((rating) => ({
      type: 'rating' as const,
      date: rating.created_at,
      rating,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (feed.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
        Aucun commentaire pour le moment.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feed.map((item) => item.type === 'rating' ? (
        <article key={`rating-${item.rating.id}`} className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <UserProfileLink userId={item.rating.user} className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">
                {item.rating.user_username}
              </UserProfileLink>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{formatDate(item.rating.created_at)}</p>
            </div>
            <span className="rounded-full border border-[rgba(200,132,73,0.3)] bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-bold text-[var(--accent-strong)]">
              Note {item.rating.score}/10
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">{item.rating.comment}</p>
        </article>
      ) : (
        <article key={`comment-${item.comment.id}`} id={`comment-${item.comment.id}`} className={`rounded-[1.6rem] border bg-[rgba(17,27,40,0.72)] p-5 transition ${focusedCommentId === item.comment.id ? 'border-[var(--accent-strong)] shadow-[0_0_0_1px_var(--accent-strong)]' : 'border-[var(--line)]'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <UserProfileLink userId={item.comment.user} className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">
                {item.comment.user_username}
              </UserProfileLink>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{formatDate(item.comment.created_at)}</p>
            </div>
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
            onUpdated={handleReactionUpdated}
          />

          {replyingTo === item.comment.id ? (
            <div className="mt-4">
              <CommentForm matchId={matchId} parentId={item.comment.id} placeholder="Ta réponse" buttonLabel="Répondre" onCreated={onCreated} />
            </div>
          ) : null}

          {(repliesByParent.get(item.comment.id) ?? []).map((reply) => (
            <div key={reply.id} id={`comment-${reply.id}`} className={`mt-4 border-l border-[var(--line)] pl-4 ${focusedCommentId === reply.id ? 'rounded-r-[1rem] bg-[rgba(200,132,73,0.08)] py-2' : ''}`}>
              <UserProfileLink userId={reply.user} className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">{reply.user_username}</UserProfileLink>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{formatDate(reply.created_at)}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{reply.content}</p>
              <CommentReactionButtons
                commentId={reply.id}
                likesCount={reply.likes_count}
                dislikesCount={reply.dislikes_count}
                myReaction={reply.my_reaction}
                onUpdated={handleReactionUpdated}
              />
            </div>
          ))}
        </article>
      ))}
    </div>
  )
}

export default DiscussionFeed
