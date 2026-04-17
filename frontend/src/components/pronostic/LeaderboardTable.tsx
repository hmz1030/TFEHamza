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
      <div className="divide-y divide-[var(--line)]">
        {entries.map((entry, index) => (
          <div key={entry.user.id} className="grid grid-cols-[72px_1fr_120px] gap-4 px-5 py-4">
            <span className="text-lg font-bold text-[var(--text)]">{index + 1}</span>
            <div>
              <p className="font-semibold text-[var(--text)]">{entry.user.username}</p>
              {entry.user.badge ? (
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{entry.user.badge.name}</p>
              ) : null}
            </div>
            <span className="text-right text-lg font-black tracking-tight text-[var(--accent-strong)]">
              {entry.total_points}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LeaderboardTable
