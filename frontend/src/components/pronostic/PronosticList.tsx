import { useState } from 'react'
import type { Pronostic } from '../../types'
import UserAvatar from '../user/UserAvatar'
import UserProfileLink from '../user/UserProfileLink'

interface PronosticListProps {
  pronostics: Pronostic[]
  currentUserId?: number
  initialVisibleCount?: number
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

function PronosticList({ pronostics, currentUserId, initialVisibleCount = 5 }: PronosticListProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount)

  const sortedPronostics = [...pronostics].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const orderedPronostics = currentUserId
    ? [
      ...sortedPronostics.filter((pronostic) => pronostic.user === currentUserId),
      ...sortedPronostics.filter((pronostic) => pronostic.user !== currentUserId),
    ]
    : sortedPronostics
  const visiblePronostics = orderedPronostics.slice(0, visibleCount)
  const hasMorePronostics = visibleCount < orderedPronostics.length

  if (orderedPronostics.length === 0) {
    return <div className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">Aucun pronostic pour le moment.</div>
  }

  return (
    <div className="space-y-4">
      {visiblePronostics.map((pronostic) => (
        <article key={pronostic.id} className="rounded-lg border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar username={pronostic.user_username} avatarUrl={pronostic.user_avatar_url} size="sm" />
              <div>
                <UserProfileLink userId={pronostic.user} className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">
                  {pronostic.user_username}
                </UserProfileLink>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{formatPronosticDate(pronostic.created_at)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black tracking-tight text-[var(--accent-strong)]">{pronostic.home_score} - {pronostic.away_score}</p>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">{pronostic.points === null ? 'Points en attente' : `${pronostic.points} point${pronostic.points > 1 ? 's' : ''}`}</p>
            </div>
          </div>
        </article>
      ))}

      {hasMorePronostics ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 5)}
            className="text-action-button text-sm"
          >
            Charger plus
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default PronosticList
