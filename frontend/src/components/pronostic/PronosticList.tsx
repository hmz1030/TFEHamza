import type { Pronostic } from '../../types'

interface PronosticListProps {
  pronostics: Pronostic[]
}

function formatPronosticDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function PronosticList({ pronostics }: PronosticListProps) {
  const sortedPronostics = [...pronostics].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  if (sortedPronostics.length === 0) {
    return <div className="rounded-[1.75rem] bg-slate-900/60 p-5 text-sm text-slate-400 ring-1 ring-white/5">Aucun pronostic pour le moment.</div>
  }

  return (
    <div className="space-y-4">
      {sortedPronostics.map((pronostic) => (
        <article key={pronostic.id} className="rounded-[1.75rem] bg-slate-900/70 p-5 ring-1 ring-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">{pronostic.user_username}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{formatPronosticDate(pronostic.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black tracking-tight text-blue-300">{pronostic.home_score} - {pronostic.away_score}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{pronostic.points === null ? 'Points en attente' : `${pronostic.points} point${pronostic.points > 1 ? 's' : ''}`}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default PronosticList
