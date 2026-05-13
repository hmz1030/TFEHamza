import toast from 'react-hot-toast'
import type { Comment } from '../../types'

interface CommentShareActionsProps {
  comment: Comment
  matchLabel?: string
}

function truncateText(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trim()}…`
}

function getCommentUrl(comment: Comment) {
  return `${window.location.origin}/matches/${comment.match}?comment=${comment.id}#comment-${comment.id}`
}

function getShareText(comment: Comment, matchLabel?: string) {
  const excerpt = truncateText(comment.content, 140)
  const context = matchLabel ? ` sur ${matchLabel}` : ''
  return `Regarde ce commentaire de ${comment.user_username}${context} : "${excerpt}"`
}

function ShareIcon({ type }: { type: 'copy' | 'x' | 'whatsapp' }) {
  if (type === 'x') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
        <path
          d="M14.2 10.3 21.7 2h-1.8l-6.5 7.2L8.2 2H2.3l7.9 11L2.3 22h1.8l6.9-7.7 5.6 7.7h5.9l-8.3-11.7Zm-2.4 2.7-.8-1.1L4.6 3.4h2.8l5.1 6.9.8 1.1 6.8 9.2h-2.8L11.8 13Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
        <path
          d="M12 3.2a8.5 8.5 0 0 0-7.2 13L3.7 20.8l4.7-1.1A8.5 8.5 0 1 0 12 3.2Zm0 1.6a6.9 6.9 0 0 1 5.9 10.4 6.9 6.9 0 0 1-8.9 2.7l-.3-.2-2.9.7.7-2.8-.2-.3A6.9 6.9 0 0 1 12 4.8Zm-3.1 3.7c-.2 0-.5.1-.7.4-.3.3-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.6 4.1 3.5 2 .8 2.4.6 2.9.6.4 0 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.5-.3l-1.6-.8c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.6.1-.3-.1-1.1-.4-2-1.2-.8-.7-1.3-1.5-1.4-1.7-.2-.3 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5L9.7 9c-.2-.4-.4-.5-.6-.5h-.2Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M8 7.5A2.5 2.5 0 0 1 10.5 5h7A2.5 2.5 0 0 1 20 7.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8 14.5v-7Zm2.5-.7c-.4 0-.7.3-.7.7v7c0 .4.3.7.7.7h7c.4 0 .7-.3.7-.7v-7c0-.4-.3-.7-.7-.7h-7ZM4 10.2c0-1 .8-1.8 1.8-1.8h.8v1.8h-.8v8h8v-.8h1.8v.8c0 1-.8 1.8-1.8 1.8h-8c-1 0-1.8-.8-1.8-1.8v-8Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CommentShareActions({ comment, matchLabel }: CommentShareActionsProps) {
  const commentUrl = getCommentUrl(comment)
  const shareText = getShareText(comment, matchLabel)
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(commentUrl)
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${commentUrl}`)}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(commentUrl)
      toast.success('Lien du commentaire copié.')
    } catch {
      toast.error('Impossible de copier le lien.')
    }
  }

  const actionClass =
    'inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-xs font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)]'

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void copyLink()} className={actionClass}>
        <ShareIcon type="copy" />
        Copier
      </button>
      <a href={xUrl} target="_blank" rel="noreferrer" className={actionClass}>
        <ShareIcon type="x" />
        X
      </a>
      <a href={whatsappUrl} target="_blank" rel="noreferrer" className={actionClass}>
        <ShareIcon type="whatsapp" />
        WhatsApp
      </a>
    </div>
  )
}

export default CommentShareActions
