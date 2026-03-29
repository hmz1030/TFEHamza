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
      setError('Impossible d envoyer la note.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.75rem] bg-slate-900/70 p-5 ring-1 ring-white/5">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-slate-300">Ta note</label>
        <input type="range" min="1" max="10" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-40 accent-blue-500" />
        <span className="w-8 text-right text-lg font-bold text-blue-300">{score}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ton avis sur le match"
        rows={4}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400"
      />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 disabled:opacity-60">
        {loading ? 'Envoi...' : 'Publier ma note'}
      </button>
    </form>
  )
}

export default RatingForm
