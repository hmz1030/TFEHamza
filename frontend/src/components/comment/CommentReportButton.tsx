import { useState } from 'react'
import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { reportComment } from '../../services/commentService'

interface CommentReportButtonProps {
  commentId: number
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M6 4.8c0-.5.4-.8.8-.8h9.8c.6 0 1 .6.7 1.2l-1.4 2.9 1.4 2.9c.3.6-.1 1.2-.7 1.2H7.6v7c0 .5-.4.8-.8.8s-.8-.4-.8-.8V4.8Zm1.6.8v5h7.7L14.2 8c-.1-.2-.1-.5 0-.7l1.1-1.7H7.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CommentReportButton({ commentId }: CommentReportButtonProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const handleReport = async () => {
    if (!user) {
      toast.error('Connecte-toi pour signaler un commentaire.')
      return
    }

    setSubmitting(true)
    try {
      await reportComment(commentId)
      toast.success('Commentaire signale aux moderateurs.')
    } catch (error) {
      const detail = isAxiosError<{ detail?: string }>(error) ? error.response?.data?.detail : undefined
      toast.error(detail ?? 'Impossible de signaler ce commentaire.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      title="Signaler"
      aria-label="Signaler ce commentaire"
      disabled={submitting}
      onClick={() => void handleReport()}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-[var(--muted-strong)] transition hover:border-[var(--danger)] hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FlagIcon />
    </button>
  )
}

export default CommentReportButton
