import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { followUser, unfollowUser } from '../../services/userService'

interface FollowButtonProps {
  userId: number
  initialFollowing?: boolean
  isFollowedBy?: boolean
  onChange?: (isFollowing: boolean) => void
}

function FollowButton({
  userId,
  initialFollowing = false,
  isFollowedBy = false,
  onChange,
}: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsFollowing(initialFollowing)
  }, [initialFollowing])

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent-strong)] hover:text-[var(--text)]"
      >
        Se connecter pour suivre
      </Link>
    )
  }

  if (user.id === userId) {
    return null
  }

  const handleToggleFollow = async () => {
    const previousValue = isFollowing
    const nextValue = !isFollowing
    setIsFollowing(nextValue)
    onChange?.(nextValue)
    setLoading(true)
    setError('')

    try {
      if (nextValue) {
        await followUser(userId)
      } else {
        await unfollowUser(userId)
      }

      toast.success(nextValue ? 'Utilisateur suivi.' : 'Utilisateur retire des suivis.')
    } catch {
      setIsFollowing(previousValue)
      onChange?.(previousValue)
      const message = nextValue ? 'Impossible de suivre cet utilisateur.' : 'Impossible de retirer le suivi.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const buttonLabel = loading
    ? 'En cours...'
    : isFollowing
      ? 'Ne plus suivre'
      : isFollowedBy
        ? 'Suivre en retour'
        : 'Suivre'

  return (
    <div className="space-y-2">
      {isFollowing && isFollowedBy ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--success)]">
          Vous vous suivez
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleToggleFollow}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isFollowing
            ? 'border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-[var(--muted-strong)] hover:border-[var(--line-strong)] hover:text-[var(--text)]'
            : 'bg-[var(--accent)] text-[var(--bg-deep)] hover:bg-[var(--accent-strong)]'
        }`}
      >
        {buttonLabel}
      </button>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  )
}

export default FollowButton
