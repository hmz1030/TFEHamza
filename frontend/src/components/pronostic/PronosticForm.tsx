import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { createPronostic } from '../../services/pronosticService'
import type { Team } from '../../types'
import { invalidateUserActivityCache } from '../../utils/activityCache'
import { isScheduled } from '../../utils/matchStatus'

interface PronosticFormProps {
  matchId: number
  status: string
  homeTeam?: Team
  awayTeam?: Team
  onCreated?: () => Promise<void> | void
}

function PronosticForm({ matchId, status, homeTeam, awayTeam, onCreated }: PronosticFormProps) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user || !isScheduled(status)) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createPronostic({ match: matchId, home_score: homeScore, away_score: awayScore })
      invalidateUserActivityCache(user.id)
      await onCreated?.()
      toast.success('Pronostic enregistre.')
    } catch {
      const message = "Impossible d'envoyer ton pronostic."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-4">
      <p className="self-start text-sm font-medium text-[var(--muted-strong)]">Ton pronostic</p>
      <input type="hidden" value={matchId} readOnly />
      <div className="flex w-full flex-wrap items-center justify-center gap-3">
        {homeTeam ? <TeamPronosticLogo team={homeTeam} /> : null}
        <input
          type="number"
          min="0"
          value={homeScore}
          onChange={(e) => setHomeScore(Number(e.target.value))}
          aria-label={homeTeam ? `Score ${homeTeam.name}` : 'Score equipe domicile'}
          className="h-12 w-16 rounded-md border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-center text-lg font-bold text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
        <span className="text-sm font-black uppercase tracking-[0.2em] text-[var(--muted)]">-</span>
        <input
          type="number"
          min="0"
          value={awayScore}
          onChange={(e) => setAwayScore(Number(e.target.value))}
          aria-label={awayTeam ? `Score ${awayTeam.name}` : 'Score equipe exterieure'}
          className="h-12 w-16 rounded-md border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-center text-lg font-bold text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
        />
        {awayTeam ? <TeamPronosticLogo team={awayTeam} /> : null}
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={loading} className="rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60">
        {loading ? 'Envoi...' : 'Pronostiquer'}
      </button>
    </form>
  )
}

function TeamPronosticLogo({ team }: { team: Team }) {
  return (
    <div className="flex w-24 min-w-0 flex-col items-center gap-1.5 text-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-white p-1.5">
        {team.logo ? (
          <img src={team.logo} alt={team.name} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs font-black text-[var(--bg-deep)]">{team.name.slice(0, 3).toUpperCase()}</span>
        )}
      </span>
      <span className="text-xs font-semibold leading-tight text-[var(--text)]">{team.name}</span>
    </div>
  )
}

export default PronosticForm
