import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-white font-bold text-xl tracking-tight">
        Match<span className="text-blue-500">Note</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-slate-300 text-sm font-medium">{user.username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition">
              Connexion
            </Link>
            <Link
              to="/register"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition"
            >
              Inscription
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
