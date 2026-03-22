export const LEAGUES = [
  'Toutes',
  'Premier League',
  'La Liga',
  'Serie A',
  'Ligue 1',
  'Bundesliga',
] as const

export type LeagueFilterValue = (typeof LEAGUES)[number]

interface LeagueOption {
  name: LeagueFilterValue
  shortName: string
  logoSrc?: string
}

const leagueOptions: LeagueOption[] = [
  { name: 'Toutes', shortName: 'T' },
  { name: 'Premier League', shortName: 'PL' },
  { name: 'La Liga', shortName: 'LL' },
  { name: 'Serie A', shortName: 'SA' },
  { name: 'Ligue 1', shortName: 'L1' },
  { name: 'Bundesliga', shortName: 'BL' },
]

interface LeagueFilterProps {
  selectedLeague: LeagueFilterValue
  onSelectLeague: (league: LeagueFilterValue) => void
}

function LeagueFilter({ selectedLeague, onSelectLeague }: LeagueFilterProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-3 pb-2">
        {leagueOptions.map((league) => {
          const isSelected = selectedLeague === league.name

          return (
            <button
              key={league.name}
              type="button"
              onClick={() => onSelectLeague(league.name)}
              className={`inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                isSelected
                  ? 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {league.logoSrc ? (
                <img
                  src={league.logoSrc}
                  alt={league.name}
                  className="h-5 w-5 rounded-full object-contain"
                />
              ) : (
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    isSelected
                      ? 'bg-slate-950/15 text-slate-950'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {league.shortName}
                </span>
              )}

              <span className="whitespace-nowrap">{league.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LeagueFilter
