import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logoMatchNote from '../../assets/logoMatchNote1.png'
import UserAvatar from '../user/UserAvatar'

const publicLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/pronostics', label: 'Pronostics' },
]

const privateLinks = [
  { to: '/favorites', label: 'Favoris' },
  { to: '/profile', label: 'Profil' },
]

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = user ? [...publicLinks, ...privateLinks] : publicLinks

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/login')
  }

  const linkClassName = (to: string) => {
    const active = location.pathname === to

    return `rounded-full px-3 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-[rgba(255,255,255,0.06)] text-[var(--text)]'
        : 'text-[var(--muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text)]'
    }`
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(8,17,27,0.88)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center" aria-label="MatchNote - accueil">
          <img
            src={logoMatchNote}
            alt="MatchNote"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={linkClassName(link.to)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/[0.03] px-3 py-1.5">
                <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" />
                <span className="text-sm font-semibold text-[var(--muted-strong)]">{user.username}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--text)]"
              >
                Deconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClassName('/login')}>
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

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] transition hover:border-[var(--line-strong)] md:hidden"
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
        >
          <span className="flex w-5 flex-col gap-1.5">
            <span className="h-0.5 rounded-full bg-[var(--text)]" />
            <span className="h-0.5 rounded-full bg-[var(--text)]" />
            <span className="h-0.5 rounded-full bg-[var(--text)]" />
          </span>
        </button>
      </div>

      {menuOpen ? (
        <div className="mx-auto mt-3 max-w-7xl space-y-3 rounded-[1.2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.96)] p-3 md:hidden">
          <div className="grid gap-1">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className={linkClassName(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>

          {user ? (
            <div className="space-y-3 border-t border-[var(--line)] pt-3">
              <div className="flex flex-wrap items-center gap-2 px-3">
                <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" />
                <span className="text-sm font-semibold text-[var(--muted-strong)]">{user.username}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--text)]"
              >
                Deconnexion
              </button>
            </div>
          ) : (
            <div className="grid gap-2 border-t border-[var(--line)] pt-3">
              <Link to="/login" onClick={() => setMenuOpen(false)} className={linkClassName('/login')}>
                Connexion
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)]"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </nav>
  )
}

export default Navbar
