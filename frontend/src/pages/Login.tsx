import axios from 'axios'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/ui/Loader'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
        setError(error.response.data.detail)
      } else {
        setError('Identifiants incorrects')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[var(--text)]">
            Match<span className="text-[var(--accent-strong)]">Note</span>
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Note, commente et pronostique les matchs!!
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(17,27,40,0.96),rgba(8,17,27,0.88))] p-8 shadow-[var(--shadow)]">
          <h2 className="mb-6 text-2xl font-bold text-[var(--text)]">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                placeholder="Lionel Messi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            {error ? (
              <p className="rounded-[1rem] border border-[rgba(216,125,116,0.22)] bg-[rgba(216,125,116,0.08)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader size="sm" label="" /> : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-medium text-[var(--accent-strong)] transition hover:text-[var(--text)]">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
