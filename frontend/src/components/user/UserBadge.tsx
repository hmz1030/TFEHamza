import type { BadgePreview } from '../../types'

interface UserBadgeProps {
  badge: BadgePreview | null
}

function UserBadge({ badge }: UserBadgeProps) {
  if (!badge) {
    return (
      <span className="inline-flex rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        Sans badge
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
      {badge.icon ? <img src={badge.icon} alt="" className="h-4 w-4 rounded-full object-cover" /> : null}
      <span>{badge.name}</span>
    </span>
  )
}

export default UserBadge
