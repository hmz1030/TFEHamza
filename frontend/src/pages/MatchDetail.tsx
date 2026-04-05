import { useParams } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import { useMatch } from '../hooks/useMatch'

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function MatchDetail() {
  const { id } = useParams()
  const matchId = Number(id)
  const { match, loading, error } = useMatch(matchId)

  if (loading) return <Loader label="Chargement du match..." />
  if (error || !match) return <div className="px-4 py-10 text-center text-red-300">{error || 'Match introuvable.'}</div>

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] bg-slate-900/80 p-6 ring-1 ring-white/5">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-300">{match.league}</p>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
            <div><p className="text-xl font-bold">{match.home_team.name}</p></div>
            <div>
              <p className="text-4xl font-black tracking-tight">{match.home_score} - {match.away_score}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{match.status}</p>
            </div>
            <div><p className="text-xl font-bold">{match.away_team.name}</p></div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-400">{formatMatchDate(match.date)}</p>
        </section>

        <nav className="flex flex-wrap gap-3">
          <a href="#pronostics" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10">Pronostics</a>
          <a href="#ratings" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10">Ratings</a>
          <a href="#votes" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10">Vote MVP</a>
        </nav>
      </div>
    </div>
  )
}

export default MatchDetail
