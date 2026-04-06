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
    return <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">Aucun joueur disponible pour afficher les votes.</div>
  }

  if (votes.length === 0) {
    return <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">Aucun vote pour le moment.</div>
  }

  const maxVotes = results[0]?.total || 1

  return (
    <div className="space-y-3 rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
      {results.map((player, index) => (
        <div key={player.id} className={`rounded-[1.2rem] border px-4 py-3 ${index === 0 ? 'border-[rgba(200,132,73,0.3)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-[rgba(255,255,255,0.03)]'}`}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[var(--text)]">{player.name}</p>
            <p className={`text-sm font-bold ${index === 0 ? 'text-[var(--accent-strong)]' : 'text-[var(--muted-strong)]'}`}>{player.total} vote{player.total > 1 ? 's' : ''}</p>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
            <div className={`h-2 rounded-full ${index === 0 ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'}`} style={{ width: `${(player.total / maxVotes) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default VoteResults
