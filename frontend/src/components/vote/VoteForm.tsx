import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMatchPlayers } from '../../services/matchService'
import { createVote } from '../../services/voteService'
import type { Match, Player } from '../../types'

interface VoteFormProps {
  match: Match
  players?: Player[]
  onCreated?: () => Promise<void> | void
}

function VoteForm({ match, players: initialPlayers = [], onCreated }: VoteFormProps) {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [error, setError] = useState('')
  const isFinished = match.status.toLowerCase().includes('finish')

  useEffect(() => {
    if (initialPlayers.length > 0) {
      setPlayers(initialPlayers)
      setSelectedPlayer(initialPlayers[0] ? String(initialPlayers[0].id) : '')
      setLoadingPlayers(false)
      return
    }

    if (!user || !isFinished || initialPlayers.length > 0) return
    let active = true
    void getMatchPlayers(match.id).then(({ data }) => {
      if (!active) return
      setPlayers(data)
      setSelectedPlayer(data[0] ? String(data[0].id) : '')
      setLoadingPlayers(false)
    }).catch(() => active && (setError('Impossible de charger les joueurs.'), setLoadingPlayers(false)))
    return () => { active = false }
  }, [initialPlayers.length, isFinished, match.id, user])

  if (!user || !isFinished) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedPlayer) return
    setLoading(true)
    setError('')
    try {
      await createVote({ match: match.id, player: Number(selectedPlayer) })
      await onCreated?.()
    } catch {
      setError('Impossible d envoyer ton vote.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.75rem] bg-slate-900/70 p-5 ring-1 ring-white/5">
      <label className="block text-sm font-medium text-slate-300">Ton MVP</label>
      <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} disabled={loadingPlayers || players.length === 0} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none">
        <optgroup label={match.home_team.name}>{players.filter((player) => player.team === match.home_team.id).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</optgroup>
        <optgroup label={match.away_team.name}>{players.filter((player) => player.team === match.away_team.id).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</optgroup>
      </select>
      {loadingPlayers && <p className="text-sm text-slate-400">Chargement des joueurs...</p>}
      {!loadingPlayers && players.length === 0 && <p className="text-sm text-slate-400">Aucun joueur disponible pour ce match.</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button type="submit" disabled={loading || loadingPlayers || !selectedPlayer} className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 disabled:opacity-60">
        {loading ? 'Envoi...' : 'Voter'}
      </button>
    </form>
  )
}

export default VoteForm
