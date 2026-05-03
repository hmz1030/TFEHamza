import { useMemo } from 'react'
import type { MatchPlayer, Player, Team } from '../../types'

type Side = 'home' | 'away'

interface FieldProps {
  matchPlayers: MatchPlayer[]
  homeTeam: Team
  awayTeam: Team
  selectedPlayerId: number | null
  onSelect?: (player: Player) => void
  disabled?: boolean
}

const POSITION_LABELS = ['GK', 'DF', 'MF', 'FW'] as const
type PositionLabel = (typeof POSITION_LABELS)[number]

const HOME_LINE_X: Record<PositionLabel, number> = {
  GK: 94,
  DF: 82,
  MF: 70,
  FW: 55,
}

const AWAY_LINE_X: Record<PositionLabel, number> = {
  GK: 6,
  DF: 15,
  MF: 29,
  FW: 43,
}

function normalizePosition(raw: string): PositionLabel | null {
  const value = (raw || '').trim().toUpperCase()

  if (!value) return null

  if (value.startsWith('G')) return 'GK'

  if (
    value.startsWith('D') ||
    value.includes('BACK') ||
    value === 'CB' ||
    value === 'LB' ||
    value === 'RB'
  ) {
    return 'DF'
  }

  if (
    value.startsWith('F') ||
    value.startsWith('A') ||
    value.includes('W') ||
    value === 'ST' ||
    value === 'CF' ||
    value === 'LW' ||
    value === 'RW'
  ) {
    return 'FW'
  }

  return 'MF'
}

function getFallbackFormation(count: number): PositionLabel[] {
  const shortFormation: PositionLabel[] = ['GK', 'DF', 'DF', 'MF', 'MF', 'FW', 'FW']
  const fullFormation: PositionLabel[] = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW']

  if (count <= 1) return ['GK']
  if (count <= 7) return shortFormation.slice(0, count)

  return fullFormation.slice(0, count)
}

interface PlacedPlayer {
  player: Player
  x: number
  y: number
  side: Side
  isStarter: boolean
}

function placePlayersForSide(
  matchPlayers: MatchPlayer[],
  teamId: number,
  side: Side,
): PlacedPlayer[] {
  const starters = matchPlayers.filter(
    (mp) => mp.is_starter && mp.player.team === teamId,
  )
  const sortedStarters = starters
    .slice()
    .sort((a, b) => (a.player.number ?? 999) - (b.player.number ?? 999))
  const fallbackFormation = getFallbackFormation(sortedStarters.length)

  const grouped = new Map<PositionLabel, Player[]>()
  POSITION_LABELS.forEach((label) => grouped.set(label, []))

  sortedStarters.forEach((mp, index) => {
    const label = normalizePosition(mp.player.position) ?? fallbackFormation[index] ?? 'MF'
    grouped.get(label)!.push(mp.player)
  })

  const xMap = side === 'home' ? HOME_LINE_X : AWAY_LINE_X
  const placed: PlacedPlayer[] = []

  POSITION_LABELS.forEach((label) => {
    const lineup = grouped.get(label) ?? []
    const count = lineup.length

    if (count === 0) return

    lineup
      .slice()
      .sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
      .forEach((player, index) => {
        const y = ((index + 1) * 100) / (count + 1)

        placed.push({
          player,
          x: xMap[label],
          y,
          side,
          isStarter: true,
        })
      })
  })

  return placed
}

interface PlayerTokenProps {
  placement: PlacedPlayer
  selected: boolean
  onSelect?: (player: Player) => void
  disabled?: boolean
}

function PlayerToken({
  placement,
  selected,
  onSelect,
  disabled,
}: PlayerTokenProps) {
  const { player, x, y, side } = placement

  const baseRing = selected
    ? 'ring-4 ring-[var(--accent)] shadow-[0_8px_24px_rgba(255,200,0,0.45)]'
    : 'ring-2 ring-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.45)]'

  const sideTint =
    side === 'home'
      ? 'bg-[rgba(15,55,90,0.92)]'
      : 'bg-[rgba(120,30,30,0.92)]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(player)}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 outline-none disabled:cursor-not-allowed"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className={`relative h-10 w-10 overflow-visible rounded-full transition-transform ${baseRing} ${sideTint}`}
      >
        <div className="h-full w-full overflow-hidden rounded-full">
          {player.image ? (
            <img
              src={player.image}
              alt={player.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/80">
              {player.number ?? '?'}
            </div>
          )}
        </div>

        {player.number !== null && player.number !== undefined ? (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow">
            {player.number}
          </span>
        ) : null}
      </div>

      <span className="max-w-[4.8rem] truncate rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] sm:max-w-[7rem] sm:text-[11px]">
        {player.name}
      </span>
    </button>
  )
}

function Field({
  matchPlayers,
  homeTeam,
  awayTeam,
  selectedPlayerId,
  onSelect,
  disabled,
}: FieldProps) {
  const placements = useMemo(() => {
    const away = placePlayersForSide(matchPlayers, awayTeam.id, 'away')
    const home = placePlayersForSide(matchPlayers, homeTeam.id, 'home')

    return [...away, ...home]
  }, [matchPlayers, homeTeam.id, awayTeam.id])

  const benchSubs = useMemo(
    () => matchPlayers.filter((mp) => !mp.is_starter),
    [matchPlayers],
  )

  if (placements.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.7)] p-8 text-center text-sm text-[var(--muted)]">
        Compositions indisponibles pour ce match.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[var(--muted-strong)]">
        <span>{awayTeam.name}</span>
        <span>{homeTeam.name}</span>
      </div>

      <div
        className="relative mx-auto aspect-[4/3] w-full max-w-[760px] overflow-hidden rounded-[1.6rem] border border-white/30 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 36px, transparent 36px 72px), linear-gradient(90deg, #1f7a3a 0%, #145c2c 100%)',
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2 bg-white/60" />

          <div className="absolute left-1/2 top-1/2 h-[30%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

          <div className="absolute left-0 top-1/2 h-[56%] w-[18%] -translate-y-1/2 border-2 border-l-0 border-white/60" />
          <div className="absolute right-0 top-1/2 h-[56%] w-[18%] -translate-y-1/2 border-2 border-r-0 border-white/60" />

          <div className="absolute left-0 top-1/2 h-[28%] w-[8%] -translate-y-1/2 border-2 border-l-0 border-white/60" />
          <div className="absolute right-0 top-1/2 h-[28%] w-[8%] -translate-y-1/2 border-2 border-r-0 border-white/60" />

          <div className="absolute left-0 top-1/2 h-[18%] w-[2px] -translate-y-1/2 bg-white/80" />
          <div className="absolute right-0 top-1/2 h-[18%] w-[2px] -translate-y-1/2 bg-white/80" />
        </div>

        {placements.map((placement) => (
          <PlayerToken
            key={placement.player.id}
            placement={placement}
            selected={placement.player.id === selectedPlayerId}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>

      {benchSubs.length > 0 ? (
        <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
            Remplaçants entrés en jeu
          </p>

          <div className="flex flex-wrap gap-3">
            {benchSubs.map((mp) => {
              const isSelected = mp.player.id === selectedPlayerId

              const ring = isSelected
                ? 'ring-4 ring-[var(--accent)]'
                : 'ring-2 ring-white/20 hover:ring-white/40'

              return (
                <button
                  key={mp.player.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect?.(mp.player)}
                  className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs text-[var(--text)] transition disabled:cursor-not-allowed"
                >
                  <span
                    className={`relative block h-7 w-7 overflow-hidden rounded-full ${ring}`}
                  >
                    {mp.player.image ? (
                      <img
                        src={mp.player.image}
                        alt={mp.player.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.06)] text-[10px] font-bold">
                        {mp.player.number ?? '?'}
                      </span>
                    )}
                  </span>

                  <span className="font-medium">{mp.player.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Field
