import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { createRating } from '../../services/ratingService'
import { isFinished } from '../../utils/matchStatus'

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
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        setIsOpen(false)
        setError('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading])

  if (!user || !isFinished(status)) return null

  const closeModal = () => {
    if (loading) return
    setIsOpen(false)
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createRating({ score, comment, match: matchId })
      setComment('')
      setScore(7)
      await onCreated?.()
      setIsOpen(false)
      toast.success('Note publiee.')
    } catch {
      const message = "Impossible d'envoyer la note."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)]"
      >
        Noter le match
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,10,18,0.78)] px-4 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rating-modal-title"
            className="w-full max-w-lg space-y-5 rounded-[1.6rem] border border-[var(--line)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="rating-modal-title" className="text-2xl font-bold text-[var(--text)]">
                  Noter le match
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Donne une note sur 10 et ajoute ton avis si tu veux.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)] disabled:opacity-60"
              >
                Fermer
              </button>
            </div>

            <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label htmlFor="rating-score" className="text-sm font-medium text-[var(--muted-strong)]">
                  Ta note
                </label>
                <span className="text-3xl font-black text-[var(--accent-strong)]">{score}/10</span>
              </div>
              <input
                id="rating-score"
                type="range"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="mt-4 w-full accent-[var(--accent)]"
              />
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ton avis sur le match"
              rows={5}
              className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
            />
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)] disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
              >
                {loading ? 'Envoi...' : 'Publier ma note'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}

export default RatingForm
