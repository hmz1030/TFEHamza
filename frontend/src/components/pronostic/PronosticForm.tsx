import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createPronostic } from '../../services/pronosticService'
import { isScheduled } from '../../utils/matchStatus'

interface PronosticFormProps {
  matchId: number
  status: string
  onCreated?: () => Promise<void> | void
}

function PronosticForm({ matchId, status, onCreated }: PronosticFormProps) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState(1)
  const [awayScore, setAwayScore] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user || !isScheduled(status)) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createPronostic({ match: matchId, home_score: homeScore, away_score: awayScore })
      await onCreated?.()
    } catch {
      setError("Impossible d'envoyer ton pronostic.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
      <p className="text-sm font-medium text-[var(--muted-strong)]">Ton pronostic</p>
      <input type="hidden" value={matchId} readOnly />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} className="rounded-[1.1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]" />
        <input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} className="rounded-[1.1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]" />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={loading} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60">
        {loading ? 'Envoi...' : 'Pronostiquer'}
      </button>
    </form>
  )
}

export default PronosticForm
