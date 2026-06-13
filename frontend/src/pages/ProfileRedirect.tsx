import { Navigate, useParams } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import { useAuth } from '../context/AuthContext'

function ProfileRedirect() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const userId = Number(id)

  if (loading) return <Loader label="Redirection..." />
  if (!Number.isFinite(userId)) return <Navigate to="/" replace />

  return <Navigate to={user?.id === userId ? '/profile' : `/users/${userId}`} replace />
}

export default ProfileRedirect
