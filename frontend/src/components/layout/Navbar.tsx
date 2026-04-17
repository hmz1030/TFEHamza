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
    <nav className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(8,17,27,0.88)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold tracking-[-0.05em] text-[var(--text)] sm:text-2xl">
          Match<span className="text-[var(--accent-strong)]">Note</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/leaderboard" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]">
            Classement
          </Link>
          {user ? (
            <>
              <Link to="/pronostics" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]">
                Pronostics
              </Link>
              <Link to="/profile" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]">
                Profil
              </Link>
              <span className="hidden rounded-full border border-[var(--line)] bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-[var(--muted-strong)] sm:inline-flex">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--text)]"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]">
                Connexion
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)]"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
