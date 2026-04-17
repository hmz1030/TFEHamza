import type { LeaderboardEntry } from '../../types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
        Aucun classement disponible pour le moment.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)]">
      <div className="grid grid-cols-[72px_1fr_120px] gap-4 border-b border-[var(--line)] px-5 py-4 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>Rang</span>
        <span>Joueur</span>
        <span className="text-right">Points</span>
      </div>
    </div>
  )
}

export default LeaderboardTable
