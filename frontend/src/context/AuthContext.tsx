import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import * as authService from '../services/authService'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Au chargement, si un token existe, on recupere le profil
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authService.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const tokens = await authService.login({ username, password })
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    const me = await authService.getMe()
    setUser(me)
  }

  const register = async (username: string, email: string, password: string) => {
    const tokens = await authService.register({ username, email, password })
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    const me = await authService.getMe()
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider')
  }
  return context
}
