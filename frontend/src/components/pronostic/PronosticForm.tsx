import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createPronostic } from '../../services/pronosticService'

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

  if (!user || status.toLowerCase() !== 'scheduled') return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createPronostic({ match: matchId, home_score: homeScore, away_score: awayScore })
      await onCreated?.()
    } catch {
      setError('Impossible d envoyer ton pronostic.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.75rem] bg-slate-900/70 p-5 ring-1 ring-white/5">
      <p className="text-sm font-medium text-slate-300">Ton pronostic</p>
      <input type="hidden" value={matchId} readOnly />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none" />
        <input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none" />
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 disabled:opacity-60">
        {loading ? 'Envoi...' : 'Pronostiquer'}
      </button>
    </form>
  )
}

export default PronosticForm
