import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
})

// Interceptor requete : ajoute le token JWT a chaque appel
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor reponse : si 401, tente un refresh du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si erreur 401 et qu'on n'a pas deja tente un refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/accounts/login/refresh/`, {
            refresh: refreshToken,
          })
          const newAccess = response.data.access
          localStorage.setItem('access_token', newAccess)

          // Relance la requete originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return api(originalRequest)
        } catch {
          // Refresh echoue → token expire, on deconnecte
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
