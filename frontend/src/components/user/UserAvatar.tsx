interface UserAvatarProps {
  username: string
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
}

function UserAvatar({ username, avatarUrl, size = 'md' }: UserAvatarProps) {
  const initial = username.trim().charAt(0).toUpperCase() || '?'
  const sizeClass = SIZE_CLASSES[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar ${username}`}
        className={`${sizeClass} rounded-full border border-[var(--line)] object-cover shadow-[0_10px_28px_rgba(0,0,0,0.35)]`}
      />
    )
  }

  return (
    <div
      aria-label={`Avatar ${username}`}
      className={`${sizeClass} flex items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.08)] font-black text-[var(--accent-strong)] shadow-[0_10px_28px_rgba(0,0,0,0.35)]`}
    >
      {initial}
    </div>
  )
}

export default UserAvatar
