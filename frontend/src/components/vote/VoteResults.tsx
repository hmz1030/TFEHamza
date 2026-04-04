import type { Player, Vote } from '../../types'

interface VoteResultsProps {
  votes: Vote[]
  players: Player[]
}

function VoteResults({ votes, players }: VoteResultsProps) {
  const results = players.map((player) => ({
    ...player,
    total: votes.filter((vote) => vote.player === player.id).length,
  })).sort((first, second) => second.total - first.total || first.name.localeCompare(second.name))

  if (results.length === 0) {
    return <div className="rounded-[1.75rem] bg-slate-900/60 p-5 text-sm text-slate-400 ring-1 ring-white/5">Aucun joueur disponible pour afficher les votes.</div>
  }

  if (votes.length === 0) {
    return <div className="rounded-[1.75rem] bg-slate-900/60 p-5 text-sm text-slate-400 ring-1 ring-white/5">Aucun vote pour le moment.</div>
  }

  const maxVotes = results[0]?.total || 1

  return (
    <div className="space-y-3 rounded-[1.75rem] bg-slate-900/70 p-5 ring-1 ring-white/5">
      {results.map((player, index) => (
        <div key={player.id} className={`rounded-2xl px-4 py-3 ${index === 0 ? 'bg-blue-500/10 ring-1 ring-blue-400/20' : 'bg-slate-950/60'}`}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-100">{player.name}</p>
            <p className={`text-sm font-bold ${index === 0 ? 'text-blue-300' : 'text-slate-300'}`}>{player.total} vote{player.total > 1 ? 's' : ''}</p>
          </div>
          <div className="h-2 rounded-full bg-slate-800">
            <div className={`h-2 rounded-full ${index === 0 ? 'bg-blue-400' : 'bg-slate-500'}`} style={{ width: `${(player.total / maxVotes) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default VoteResults
