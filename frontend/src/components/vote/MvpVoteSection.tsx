import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Field from '../field/Field'
import { useAuth } from '../../context/AuthContext'
import { createVote } from '../../services/voteService'
import type { Match, MatchPlayer, Player, Vote } from '../../types'
import { isFinished } from '../../utils/matchStatus'

interface MvpVoteSectionProps {
  match: Match
  matchPlayers: MatchPlayer[]
  votes: Vote[]
  loadingPlayers: boolean
  onCreated?: () => Promise<void> | void
}

function MvpVoteSection({ match, matchPlayers, votes, loadingPlayers, onCreated }: MvpVoteSectionProps) {
  const { user } = useAuth()
  const finished = isFinished(match.status)

  const myVote = useMemo(
    () => (user ? votes.find((vote) => vote.user === user.id) ?? null : null),
    [user, votes],
  )

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(myVote?.player ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedPlayerId(myVote?.player ?? null)
  }, [myVote?.player])

  const playersById = useMemo(() => {
    const map = new Map<number, Player>()
    matchPlayers.forEach((mp) => map.set(mp.player.id, mp.player))
    return map
  }, [matchPlayers])

  if (loadingPlayers) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-8 text-center text-sm text-[var(--muted)]">
        Chargement des compositions...
      </div>
    )
  }

  if (matchPlayers.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-8 text-center text-sm text-[var(--muted)]">
        Compositions indisponibles pour ce match.
      </div>
    )
  }

  const handleSelect = (player: Player) => {
    if (!user || !finished || myVote) return
    setError('')
    setSelectedPlayerId(player.id)
  }

  const handleSubmit = async () => {
    if (!selectedPlayerId) return
    setSubmitting(true)
    setError('')
    try {
      await createVote({ match: match.id, player: selectedPlayerId })
      await onCreated?.()
      toast.success('Vote enregistre.')
    } catch {
      const message = "Impossible d'envoyer ton vote."
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlayer = selectedPlayerId ? playersById.get(selectedPlayerId) : null
  const canVote = Boolean(user && finished && !myVote)
  const fieldDisabled = !canVote

  return (
    <div className="space-y-4">
      <Field
        matchPlayers={matchPlayers}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        selectedPlayerId={selectedPlayerId}
        onSelect={handleSelect}
        disabled={fieldDisabled}
      />

      {!user ? (
        <p className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-4 text-center text-sm text-[var(--muted)]">
          Connecte-toi pour voter pour le MVP du match.
        </p>
      ) : !finished ? (
        <p className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-4 text-center text-sm text-[var(--muted)]">
          Le vote MVP s'ouvre une fois le match termine.
        </p>
      ) : myVote ? (
        <div className="rounded-[1.2rem] border border-[var(--accent-soft)] bg-[rgba(255,200,0,0.08)] p-4 text-center text-sm text-[var(--accent-strong)]">
          Tu as vote pour <span className="font-semibold">{playersById.get(myVote.player)?.name ?? 'ce joueur'}</span>.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-4">
          <p className="text-sm text-[var(--muted-strong)]">
            {selectedPlayer ? (
              <>Pret a voter pour <span className="font-semibold text-[var(--text)]">{selectedPlayer.name}</span> ?</>
            ) : (
              'Clique sur un joueur pour le designer MVP.'
            )}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedPlayerId || submitting}
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
          >
            {submitting ? 'Envoi...' : 'Voter'}
          </button>
        </div>
      )}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  )
}

export default MvpVoteSection
