import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { reactToComment } from '../../services/commentService'
import type { CommentReactionValue } from '../../types'

interface CommentReactionPayload {
  comment: number
  likes_count: number
  dislikes_count: number
  my_reaction: CommentReactionValue | null
}

interface CommentReactionButtonsProps {
  commentId: number
  likesCount: number
  dislikesCount: number
  myReaction: CommentReactionValue | null
  onUpdated?: (payload: CommentReactionPayload) => Promise<void> | void
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
    try {
      const response = await reactToComment(commentId, value)
      await onUpdated?.(response.data)
    } catch {
      toast.error("Impossible d'enregistrer ta reaction.")
    } finally {
      setSubmitting(null)
    }
  }

  const baseClass =
    'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'
  const inactiveClass = 'border-[var(--line)] text-[var(--muted-strong)] hover:text-[var(--text)]'
  const likeClass =
    myReaction === 'like'
      ? 'border-[rgba(110,160,124,0.55)] bg-[rgba(110,160,124,0.16)] text-[var(--success)]'
      : inactiveClass
  const dislikeClass =
    myReaction === 'dislike'
      ? 'border-[rgba(197,109,100,0.55)] bg-[rgba(197,109,100,0.16)] text-[var(--danger)]'
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
