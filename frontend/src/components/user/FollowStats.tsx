import followersIcon from '../../assets/followers.svg'
import followingIcon from '../../assets/following.svg'

interface FollowStatsProps {
  followersCount: number
  followingCount: number
}

function FollowStats({ followersCount, followingCount }: FollowStatsProps) {
  const itemClass =
    'inline-flex h-9 items-center gap-2 rounded-full bg-[rgba(255,255,255,0.08)] px-3 text-sm font-black text-[var(--text)]'
  const iconClass = 'h-4 w-4 opacity-75'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={itemClass} title="Abonnes">
        <span>{followersCount}</span>
        <img src={followersIcon} alt="" className={iconClass} aria-hidden="true" />
      </span>
      <span className={itemClass} title="Abonnements">
        <span>{followingCount}</span>
        <img src={followingIcon} alt="" className={iconClass} aria-hidden="true" />
      </span>
    </div>
  )
}

export default FollowStats
