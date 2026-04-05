import { useParams } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import { useMatch } from '../hooks/useMatch'

function MatchDetail() {
  const { id } = useParams()
  const matchId = Number(id)
  const { match, loading, error } = useMatch(matchId)

  if (loading) return <Loader label="Chargement du match..." />
  if (error || !match) return <div className="px-4 py-10 text-center text-red-300">{error || 'Match introuvable.'}</div>

  return <div className="px-4 py-10 text-slate-100">{match.home_team.name} - {match.away_team.name}</div>
}

export default MatchDetail
