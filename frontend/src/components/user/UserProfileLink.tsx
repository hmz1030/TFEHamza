import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface UserProfileLinkProps {
  userId: number
  children: string
  className?: string
}

function UserProfileLink({ userId, children, className }: UserProfileLinkProps) {
  const { user } = useAuth()
  const to = user?.id === userId ? '/profile' : `/users/${userId}`

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

export default UserProfileLink
