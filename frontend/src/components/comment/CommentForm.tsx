import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { createComment } from '../../services/commentService'

interface CommentFormProps {
  matchId: number
  parentId?: number | null
  placeholder?: string
  buttonLabel?: string
  onCreated?: () => Promise<void> | void
}

function CommentForm({ matchId, parentId = null, placeholder = 'Ton commentaire', buttonLabel = 'Commenter', onCreated }: CommentFormProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(17,27,40,0.55)] p-4 text-sm text-[var(--muted)]">
        Connecte-toi pour participer à la discussion.
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      await createComment({ match: matchId, parent: parentId, content: content.trim() })
      setContent('')
      await onCreated?.()
      toast.success(parentId ? 'Réponse publiée.' : 'Commentaire publié.')
    } catch {
      const message = "Impossible d'envoyer le commentaire."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-4">
      <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={placeholder} rows={parentId ? 2 : 4} className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]" />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={loading || !content.trim()} className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60">
        {loading ? 'Envoi...' : buttonLabel}
      </button>
    </form>
  )
}

export default CommentForm
