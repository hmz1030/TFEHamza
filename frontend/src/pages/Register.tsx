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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Match<span className="text-blue-500">Note</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Notez, commentez, pronostiques vos matchs
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Créer un compte</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                placeholder="votre_username"
                value={username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                required
                className={`w-full bg-slate-800 border text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition ${
                  fieldErrors.username
                    ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400'
                    : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.username && (
                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                required
                className={`w-full bg-slate-800 border text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition ${
                  fieldErrors.email
                    ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400'
                    : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                required
                minLength={8}
                className={`w-full bg-slate-800 border text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition ${
                  fieldErrors.password
                    ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400'
                    : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              <p className="text-slate-500 text-xs mt-1.5">
                Minimum 8 caractères, 1 majuscule et 1 caractère spécial
              </p>
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            {fieldErrors.general && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {fieldErrors.general}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition mt-2"
            >
              {loading ? <Loader size="sm" label="" /> : "S'inscrire"}
            </button>
          </form>
        </div>

        {/* Lien connexion */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
