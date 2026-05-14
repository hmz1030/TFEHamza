import type { ReactNode } from 'react'
import type { LeaderboardEntry } from '../../types'
import UserBadge from '../user/UserBadge'
import UserProfileLink from '../user/UserProfileLink'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  headerAction?: ReactNode
}

function LeaderboardTable({ entries, headerAction }: LeaderboardTableProps) {
  const gridClass = headerAction
    ? 'grid-cols-[72px_1fr_120px_auto]'
    : 'grid-cols-[72px_1fr_120px]'

  if (entries.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)]">
        {headerAction ? <div className="flex justify-end border-b border-[var(--line)] px-5 py-4">{headerAction}</div> : null}
        <div className="p-5 text-sm text-[var(--muted)]">Aucun classement disponible pour le moment.</div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)]">
      <div className={`grid ${gridClass} gap-4 border-b border-[var(--line)] px-5 py-4 text-xs uppercase tracking-[0.18em] text-[var(--muted)]`}>
        <span>Rang</span>
        <span>Joueur</span>
        <span className="text-right">Points</span>
        {headerAction ? <span className="text-right">{headerAction}</span> : null}
      </div>
      <div className="divide-y divide-[var(--line)]">
        {entries.map((entry, index) => (
          <div key={entry.user.id} className={`grid ${gridClass} gap-4 px-5 py-4`}>
            <span className="text-lg font-bold text-[var(--text)]">{index + 1}</span>
            <div>
              <UserProfileLink userId={entry.user.id} className="font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">
                {entry.user.username}
              </UserProfileLink>
              <div className="mt-2">
                <UserBadge badge={entry.user.badge} />
              </div>
            </div>
            <span className="text-right text-lg font-black tracking-tight text-[var(--accent-strong)]">
              {entry.total_points}
            </span>
            {headerAction ? <span /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LeaderboardTable
