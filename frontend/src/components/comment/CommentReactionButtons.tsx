import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { reactToComment } from '../../services/commentService'
import type { CommentReactionResult, CommentReactionValue } from '../../types'

interface CommentReactionButtonsProps {
  commentId: number
  likesCount: number
  dislikesCount: number
  myReaction: CommentReactionValue | null
  onUpdated?: (payload: CommentReactionResult) => Promise<void> | void
}

function ThumbIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d={
          direction === 'up'
            ? 'M7.5 10.5 11.2 4c.4-.7 1.4-.8 1.9-.2.4.5.5 1.1.3 1.7l-.9 3h5.2c1.3 0 2.3 1.2 2 2.5l-1.2 5.8c-.2 1-1.1 1.7-2.1 1.7H7.5v-8Zm-4 0h2.2v8H3.5v-8Z'
            : 'M7.5 13.5 11.2 20c.4.7 1.4.8 1.9.2.4-.5.5-1.1.3-1.7l-.9-3h5.2c1.3 0 2.3-1.2 2-2.5l-1.2-5.8c-.2-1-1.1-1.7-2.1-1.7H7.5v8Zm-4 0h2.2v-8H3.5v8Z'
        }
        fill="currentColor"
      />
    </svg>
  )
}

function optimisticReaction(
  commentId: number,
  likesCount: number,
  dislikesCount: number,
  currentReaction: CommentReactionValue | null,
  nextReaction: CommentReactionValue,
): CommentReactionResult {
  if (currentReaction === nextReaction) {
    return {
      comment: commentId,
      likes_count: nextReaction === 'like' ? Math.max(0, likesCount - 1) : likesCount,
      dislikes_count: nextReaction === 'dislike' ? Math.max(0, dislikesCount - 1) : dislikesCount,
      my_reaction: null,
    }
  }

  return {
    comment: commentId,
    likes_count: likesCount + (nextReaction === 'like' ? 1 : 0) - (currentReaction === 'like' ? 1 : 0),
    dislikes_count: dislikesCount + (nextReaction === 'dislike' ? 1 : 0) - (currentReaction === 'dislike' ? 1 : 0),
    my_reaction: nextReaction,
  }
}

function CommentReactionButtons({
  commentId,
  likesCount,
  dislikesCount,
  myReaction,
  onUpdated,
}: CommentReactionButtonsProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState<CommentReactionValue | null>(null)

  const handleReact = async (value: CommentReactionValue) => {
    if (!user) {
      toast.error('Connecte-toi pour reagir aux commentaires.')
      return
    }

    setSubmitting(value)
    const previous: CommentReactionResult = {
      comment: commentId,
      likes_count: likesCount,
      dislikes_count: dislikesCount,
      my_reaction: myReaction,
    }

    try {
      await onUpdated?.(optimisticReaction(commentId, likesCount, dislikesCount, myReaction, value))
      const response = await reactToComment(commentId, value)
      await onUpdated?.(response.data)
    } catch {
      await onUpdated?.(previous)
      toast.error("Impossible d'enregistrer ta reaction.")
    } finally {
      setSubmitting(null)
    }
  }

  const baseClass =
    'inline-flex items-center gap-1.5 bg-transparent p-0 text-xs font-semibold transition hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60'
  const inactiveClass = 'text-[var(--muted-strong)]'
  const likeClass =
    myReaction === 'like'
      ? 'text-[var(--success)]'
      : inactiveClass
  const dislikeClass =
    myReaction === 'dislike'
      ? 'text-[var(--danger)]'
      : inactiveClass

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={myReaction === 'like'}
        title="J'aime"
        disabled={submitting !== null}
        onClick={() => void handleReact('like')}
        className={`${baseClass} ${likeClass}`}
      >
        <ThumbIcon direction="up" />
        <span>{likesCount}</span>
      </button>

      <button
        type="button"
        aria-pressed={myReaction === 'dislike'}
        title="Je n'aime pas"
        disabled={submitting !== null}
        onClick={() => void handleReact('dislike')}
        className={`${baseClass} ${dislikeClass}`}
      >
        <ThumbIcon direction="down" />
        <span>{dislikesCount}</span>
      </button>
    </div>
  )
}

export default CommentReactionButtons
