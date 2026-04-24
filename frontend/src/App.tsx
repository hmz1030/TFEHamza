import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import MatchDetail from './pages/MatchDetail'
import Pronostics from './pages/Pronostics'
import Profile from './pages/Profile'
import Register from './pages/Register'
import UserPublic from './pages/UserPublic'
import Loader from './components/ui/Loader'

const AUTH_ROUTES = ['/login', '/register']

function AppContent() {
  const { loading } = useAuth()
  const location = useLocation()
  const isAuthPage = AUTH_ROUTES.includes(location.pathname)

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/pronostics" element={<ProtectedRoute><Pronostics /></ProtectedRoute>} />
          <Route path="/users/:id" element={<UserPublic />} />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#141c24',
              border: '1px solid #2d3a46',
              color: '#e8e3d9',
            },
            success: {
              iconTheme: {
                primary: '#6ea07c',
                secondary: '#070c11',
              },
            },
            error: {
              iconTheme: {
                primary: '#c56d64',
                secondary: '#070c11',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
