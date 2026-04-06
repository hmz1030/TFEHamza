import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createRating } from '../../services/ratingService'

interface RatingFormProps {
  matchId: number
  status: string
  onCreated?: () => Promise<void> | void
}

function RatingForm({ matchId, status, onCreated }: RatingFormProps) {
  const { user } = useAuth()
  const [score, setScore] = useState(7)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user || status.toLowerCase() !== 'finished') return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createRating({ score, comment, match: matchId })
      setComment('')
      setScore(7)
      await onCreated?.()
    } catch {
      setError("Impossible d'envoyer la note.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="text-sm font-medium text-[var(--muted-strong)]">Ta note</label>
        <input type="range" min="1" max="10" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-40 accent-[var(--accent)]" />
        <span className="w-8 text-right text-lg font-bold text-[var(--accent-strong)]">{score}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ton avis sur le match"
        rows={4}
        className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
      />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={loading} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60">
        {loading ? 'Envoi...' : 'Publier ma note'}
      </button>
    </form>
  )
}

export default RatingForm
