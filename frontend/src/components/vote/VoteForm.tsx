import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMatchPlayers } from '../../services/matchService'
import { createVote } from '../../services/voteService'
import type { Match, Player } from '../../types'
import { isFinished } from '../../utils/matchStatus'

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
  const finished = isFinished(match.status)

  useEffect(() => {
    if (initialPlayers.length > 0) {
      setPlayers(initialPlayers)
      setSelectedPlayer(initialPlayers[0] ? String(initialPlayers[0].id) : '')
      setLoadingPlayers(false)
      return
    }

    if (!user || !finished || initialPlayers.length > 0) return
    let active = true
    void getMatchPlayers(match.id).then(({ data }) => {
      if (!active) return
      setPlayers(data)
      setSelectedPlayer(data[0] ? String(data[0].id) : '')
      setLoadingPlayers(false)
    }).catch(() => active && (setError('Impossible de charger les joueurs.'), setLoadingPlayers(false)))
    return () => { active = false }
  }, [finished, initialPlayers.length, match.id, user])

  if (!user || !finished) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedPlayer) return
    setLoading(true)
    setError('')
    try {
      await createVote({ match: match.id, player: Number(selectedPlayer) })
      await onCreated?.()
    } catch {
      setError("Impossible d'envoyer ton vote.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
      <label className="block text-sm font-medium text-[var(--muted-strong)]">Ton MVP</label>
      <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} disabled={loadingPlayers || players.length === 0} className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]">
        <optgroup label={match.home_team.name}>{players.filter((player) => player.team === match.home_team.id).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</optgroup>
        <optgroup label={match.away_team.name}>{players.filter((player) => player.team === match.away_team.id).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</optgroup>
      </select>
      {loadingPlayers ? <p className="text-sm text-[var(--muted)]">Chargement des joueurs...</p> : null}
      {!loadingPlayers && players.length === 0 ? <p className="text-sm text-[var(--muted)]">Aucun joueur disponible pour ce match.</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={loading || loadingPlayers || !selectedPlayer} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60">
        {loading ? 'Envoi...' : 'Voter'}
      </button>
    </form>
  )
}

export default VoteForm
