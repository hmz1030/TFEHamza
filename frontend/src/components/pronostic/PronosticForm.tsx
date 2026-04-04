import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface PronosticFormProps {
  matchId: number
  status: string
}

function PronosticForm({ matchId, status }: PronosticFormProps) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState(1)
  const [awayScore, setAwayScore] = useState(1)

  if (!user || status.toLowerCase() !== 'scheduled') return null

  return (
    <form className="space-y-4 rounded-[1.75rem] bg-slate-900/70 p-5 ring-1 ring-white/5">
      <p className="text-sm font-medium text-slate-300">Ton pronostic</p>
      <input type="hidden" value={matchId} readOnly />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none" />
        <input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none" />
      </div>
      <button type="submit" className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400">
        Pronostiquer
      </button>
    </form>
  )
}

export default PronosticForm
