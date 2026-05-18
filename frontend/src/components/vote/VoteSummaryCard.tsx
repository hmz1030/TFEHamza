import { Link } from 'react-router-dom'
import type { Match } from '../../types'
import type { ActivityData } from '../../services/userService'

interface VoteSummaryCardProps {
  vote: ActivityData['votes'][number]
  match?: Match
}

function TeamLogo({ src, name }: { src?: string; name: string }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1">
      {src ? <img src={src} alt={name} className="h-full w-full object-contain" /> : (
        <span className="text-xs font-black text-[var(--bg-deep)]">{name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  )
}

function VoteSummaryCard({ vote, match }: VoteSummaryCardProps) {
  const player = vote.player_detail

  return (
    <Link
      to={`/matches/${vote.match}`}
      className="flex min-h-56 flex-col items-center justify-between rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.04)] p-4 text-center transition hover:border-[var(--accent-strong)]"
    >
      <span className="rounded-full border border-[rgba(200,132,73,0.32)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--accent-strong)]">
        MVP
      </span>
      <div className="mt-3">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          {player?.image ? <img src={player.image} alt={player.name} className="h-full w-full object-cover" /> : (
            <span className="text-2xl font-black text-[var(--muted)]">{player?.name?.slice(0, 1) ?? '?'}</span>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-bold text-[var(--text)]">{player?.name ?? `Joueur #${vote.player}`}</h3>
        {player?.position ? <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{player.position}</p> : null}
      </div>
      {match ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          <TeamLogo src={match.home_team.logo} name={match.home_team.name} />
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">vs</span>
          <TeamLogo src={match.away_team.logo} name={match.away_team.name} />
        </div>
      ) : null}
    </Link>
  )
}

export default VoteSummaryCard
