import type { BadgePreview } from '../../types'
import badgeAnalyst from '../../assets/badge_analyst.png'
import badgeDebutant from '../../assets/badge_debutant.png'
import badgeGoat from '../../assets/badge_goat.png'
import badgeSupporter from '../../assets/badge_supporter.png'

interface UserBadgeProps {
  badge: BadgePreview | null
  variant?: 'compact' | 'profile'
}

const BADGES = {
  debutant: {
    name: 'Débutant',
    image: badgeDebutant,
  },
  supporter: {
    name: 'Supporter',
    image: badgeSupporter,
  },
  analyste: {
    name: 'Analyste',
    image: badgeAnalyst,
  },
  goat: {
    name: 'GOAT',
    image: badgeGoat,
  },
}

function getBadgeFromName(name: string) {
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (normalizedName === 'goat') return BADGES.goat
  if (normalizedName === 'analyste' || normalizedName === 'analyst') return BADGES.analyste
  if (normalizedName === 'supporter') return BADGES.supporter
  if (normalizedName === 'debutant') return BADGES.debutant
  return null
}

function UserBadge({ badge, variant = 'compact' }: UserBadgeProps) {
  const resolvedBadge =
    badge
      ? getBadgeFromName(badge.name) ?? {
        name: badge.name,
        image: badge.icon,
      }
      : null

  if (!resolvedBadge) {
    return (
      <span className="inline-flex rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        Sans badge
      </span>
    )
  }

  if (variant === 'profile') {
    return (
      <div className="inline-flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.04)] p-2 pr-4">
        {resolvedBadge.image ? (
          <img src={resolvedBadge.image} alt="" className="h-14 w-14 rounded-[0.9rem] object-contain" />
        ) : null}
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Badge
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--text)]">{resolvedBadge.name}</p>
        </div>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
      {resolvedBadge.image ? (
        <img src={resolvedBadge.image} alt="" className="h-5 w-5 rounded-full object-contain" />
      ) : null}
      <span>{resolvedBadge.name}</span>
    </span>
  )
}

export default UserBadge
