import axios from 'axios'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/ui/Loader'

interface RegisterFieldErrors {
  username?: string
  email?: string
  password?: string
  general?: string
}

function validateRegisterField(
  field: 'username' | 'email' | 'password',
  value: string
) {
  if (field === 'username') {
    if (!value.trim()) return "Le nom d'utilisateur est requis."
    if (value.trim().length < 3) return "Le nom d'utilisateur doit contenir au moins 3 caractères."
    return ''
  }

  if (field === 'email') {
    if (!value.trim()) return "L'email est requis."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Veuillez entrer un email valide.'
    return ''
  }

  if (!value) return 'Le mot de passe est requis.'
  if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (!/[A-Z]/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule.'
  if (!/[^A-Za-z0-9]/.test(value)) return 'Le mot de passe doit contenir au moins un caractère spécial.'
  return ''
}

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleFieldChange = (field: 'username' | 'email' | 'password', value: string) => {
    if (field === 'username') setUsername(value)
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)

    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateRegisterField(field, value),
      general: '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: RegisterFieldErrors = {
      username: validateRegisterField('username', username),
      email: validateRegisterField('email', email),
      password: validateRegisterField('password', password),
    }

    if (nextErrors.username || nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      await register(username, email, password)
      navigate('/')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as Record<string, string[] | string>
        const usernameError = Array.isArray(data.username)
          ? data.username[0]
          : typeof data.username === 'string'
            ? data.username
            : undefined
        const emailError = Array.isArray(data.email)
          ? data.email[0]
          : typeof data.email === 'string'
            ? data.email
            : undefined
        const passwordError = Array.isArray(data.password)
          ? data.password[0]
          : typeof data.password === 'string'
            ? data.password
            : undefined
        const detailError = Array.isArray(data.detail)
          ? data.detail[0]
          : typeof data.detail === 'string'
            ? data.detail
            : undefined

        setFieldErrors({
          username: usernameError,
          email: emailError,
          password: passwordError,
          general: detailError ?? (!usernameError && !emailError && !passwordError
            ? "Erreur lors de l'inscription"
            : undefined),
        })
      } else {
        setFieldErrors({
          general: "Erreur lors de l'inscription",
        })
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
            Crée ton compte et rejoins l&apos;ambiance du match.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(17,27,40,0.96),rgba(8,17,27,0.88))] p-8 shadow-[var(--shadow)]">
          <h2 className="mb-6 text-2xl font-bold text-[var(--text)]">Créer un compte</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                placeholder="votre_username"
                value={username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                required
                className={`w-full rounded-[1.2rem] border bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition focus:outline-none ${
                  fieldErrors.username
                    ? 'border-[rgba(216,125,116,0.35)] focus:border-[var(--danger)]'
                    : 'border-[var(--line)] focus:border-[var(--accent)]'
                }`}
              />
              {fieldErrors.username ? (
                <p className="mt-1.5 text-sm text-[var(--danger)]">{fieldErrors.username}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                Email
              </label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                required
                className={`w-full rounded-[1.2rem] border bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition focus:outline-none ${
                  fieldErrors.email
                    ? 'border-[rgba(216,125,116,0.35)] focus:border-[var(--danger)]'
                    : 'border-[var(--line)] focus:border-[var(--accent)]'
                }`}
              />
              {fieldErrors.email ? (
                <p className="mt-1.5 text-sm text-[var(--danger)]">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                required
                minLength={8}
                className={`w-full rounded-[1.2rem] border bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition focus:outline-none ${
                  fieldErrors.password
                    ? 'border-[rgba(216,125,116,0.35)] focus:border-[var(--danger)]'
                    : 'border-[var(--line)] focus:border-[var(--accent)]'
                }`}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)]">
                Minimum 8 caractères, 1 majuscule et 1 caractère spécial.
              </p>
              {fieldErrors.password ? (
                <p className="mt-1.5 text-sm text-[var(--danger)]">{fieldErrors.password}</p>
              ) : null}
            </div>

            {fieldErrors.general ? (
              <p className="rounded-[1rem] border border-[rgba(216,125,116,0.22)] bg-[rgba(216,125,116,0.08)] px-3 py-2 text-sm text-[var(--danger)]">
                {fieldErrors.general}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader size="sm" label="" /> : "S'inscrire"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-[var(--accent-strong)] transition hover:text-[var(--text)]">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
