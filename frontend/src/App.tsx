import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import MatchDetail from './pages/MatchDetail'
import Register from './pages/Register'
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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
