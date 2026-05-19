import type { Match } from '../../types'
import MatchCard from './MatchCard'
import { LEAGUES } from './LeagueFilter'

interface MatchListProps {
  matches: Match[]
}

const LEAGUE_ORDER = LEAGUES.filter((league) => league !== 'Toutes')

function groupMatchesByLeague(matches: Match[]) {
  const groups = new Map<string, Match[]>()

  matches.forEach((match) => {
    const leagueMatches = groups.get(match.league) ?? []
    leagueMatches.push(match)
    groups.set(match.league, leagueMatches)
  })

  return Array.from(groups.entries()).sort(([leagueA], [leagueB]) => {
    const orderA = LEAGUE_ORDER.indexOf(leagueA as (typeof LEAGUE_ORDER)[number])
    const orderB = LEAGUE_ORDER.indexOf(leagueB as (typeof LEAGUE_ORDER)[number])

    if (orderA === -1 && orderB === -1) {
      return leagueA.localeCompare(leagueB)
    }

    if (orderA === -1) return 1
    if (orderB === -1) return -1

    return orderA - orderB
  })
}

function MatchList({ matches }: MatchListProps) {
  const groupedMatches = groupMatchesByLeague(matches)

  if (matches.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] px-6 py-12 text-center shadow-[var(--shadow)]">
        <p className="text-lg font-semibold text-[var(--text)]">Aucun match à afficher</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Essaie un autre filtre ou relance une synchronisation des matchs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {groupedMatches.map(([league, leagueMatches]) => (
        <section key={league} className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
                Championnat
              </p>
              <h2 className="mt-2 text-3xl font-bold text-[var(--text)]">
                {league}
              </h2>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {leagueMatches.length} match{leagueMatches.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {leagueMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default MatchList
