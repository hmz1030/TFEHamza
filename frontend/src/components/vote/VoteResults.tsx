import type { Match, MatchPlayer, Vote } from '../../types'
import MvpFutCard, { type MvpCardPlayer } from './MvpFutCard'

interface VoteResultsProps {
  votes: Vote[]
  matchPlayers: MatchPlayer[]
  match: Match
}

function getClubForMatchPlayer(match: Match, matchPlayer: MatchPlayer) {
  const teamId = matchPlayer.team ?? matchPlayer.player.team
  if (teamId === match.home_team.id) return match.home_team
  if (teamId === match.away_team.id) return match.away_team
  return match.home_team
}

function buildMvpRanking(votes: Vote[], matchPlayers: MatchPlayer[], match: Match): MvpCardPlayer[] {
  return matchPlayers
    .map((matchPlayer) => {
      const club = getClubForMatchPlayer(match, matchPlayer)

      return {
        ...matchPlayer.player,
        total: votes.filter((vote) => vote.player === matchPlayer.player.id).length,
        goals: matchPlayer.goals,
        assists: matchPlayer.assists,
        clubLogo: club.logo,
        clubName: club.name,
      }
    })
    .filter((player) => player.total > 0)
    .sort((first, second) => second.total - first.total || first.name.localeCompare(second.name))
    .slice(0, 3)
}

function VoteResults({ votes, matchPlayers, match }: VoteResultsProps) {
  if (matchPlayers.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-center text-sm text-[var(--muted)]">
        Aucun joueur disponible pour afficher les votes.
      </div>
    )
  }

  if (votes.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-center text-sm text-[var(--muted)]">
        Aucun vote pour le moment.
      </div>
    )
  }

  const results = buildMvpRanking(votes, matchPlayers, match)

  if (results.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-center text-sm text-[var(--muted)]">
        Les votes existent, mais aucun joueur correspondant n'est disponible.
      </div>
    )
  }

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-[radial-gradient(circle_at_top,rgba(200,132,73,0.18),transparent_38%),rgba(17,27,40,0.72)] p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--accent-strong)]">Top MVP</p>
          <h3 className="mt-1 text-2xl font-black text-[var(--text)]">Le podium du match</h3>
        </div>
        <p className="text-sm text-[var(--muted)]">Buts, passes et votes en direct.</p>
      </div>

      <div className="grid max-w-[40rem] gap-4 md:grid-cols-3 md:gap-2">
        {results.map((player, index) => (
          <MvpFutCard key={player.id} player={player} rank={index} />
        ))}
      </div>
    </div>
  )
}

export default VoteResults
