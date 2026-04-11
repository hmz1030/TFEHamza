import { useEffect, useState } from 'react'
import PronosticForm from '../components/pronostic/PronosticForm'
import Loader from '../components/ui/Loader'
import type { Match, Pronostic as PronosticType } from '../types'
import { getMatches } from '../services/matchService'
import { getMyActivity } from '../services/userService'

function Pronostics() {
  const [matches, setMatches] = useState<Match[]>([])
  const [history, setHistory] = useState<PronosticType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getMatches(), getMyActivity()])
      .then(([matchesResponse, activityResponse]) => {
        setMatches(matchesResponse.data)
        setHistory(activityResponse.data.pronostics)
      })
      .catch(() => setError("Impossible de charger les pronostics."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Chargement des pronostics..." />

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">Pronostics</h1>
      </div>
    </div>
  )
}

export default Pronostics
