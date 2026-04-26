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

const HOME_LINE_Y: Record<PositionLabel, number> = {
  GK: 96,
  DF: 84,
  MF: 72,
  FW: 60,
}

const AWAY_LINE_Y: Record<PositionLabel, number> = {
  GK: 4,
  DF: 16,
  MF: 28,
  FW: 40,
}

function normalizePosition(raw: string): PositionLabel {
  const value = (raw || '').toUpperCase()
  if (value.startsWith('G')) return 'GK'
  if (value.startsWith('D') || value.includes('B')) return 'DF'
  if (value.startsWith('F') || value.startsWith('A') || value.includes('W') || value === 'ST' || value === 'CF') return 'FW'
  return 'MF'
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
  const starters = matchPlayers.filter((mp) => mp.is_starter && mp.player.team === teamId)
  const grouped = new Map<PositionLabel, Player[]>()
  POSITION_LABELS.forEach((label) => grouped.set(label, []))

  starters.forEach((mp) => {
    const label = normalizePosition(mp.player.position)
    grouped.get(label)!.push(mp.player)
  })

  const yMap = side === 'home' ? HOME_LINE_Y : AWAY_LINE_Y
  const placed: PlacedPlayer[] = []
  POSITION_LABELS.forEach((label) => {
    const lineup = grouped.get(label) ?? []
    const count = lineup.length
    if (count === 0) return
    lineup
      .slice()
      .sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
      .forEach((player, index) => {
        const x = ((index + 1) * 100) / (count + 1)
        placed.push({ player, x, y: yMap[label], side, isStarter: true })
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

function PlayerToken({ placement, selected, onSelect, disabled }: PlayerTokenProps) {
  const { player, x, y, side } = placement
  const baseRing = selected
    ? 'ring-4 ring-[var(--accent)] shadow-[0_8px_24px_rgba(255,200,0,0.45)]'
    : 'ring-2 ring-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.45)]'
  const sideTint = side === 'home' ? 'bg-[rgba(15,55,90,0.92)]' : 'bg-[rgba(120,30,30,0.92)]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(player)}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 outline-none disabled:cursor-not-allowed"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`relative h-12 w-12 overflow-hidden rounded-full transition-transform ${baseRing} ${sideTint} hover:scale-110`}>
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
        {player.number !== null && player.number !== undefined ? (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow">
            {player.number}
          </span>
        ) : null}
      </div>
      <span className="max-w-[8rem] truncate rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
        {player.name}
      </span>
    </button>
  )
}

function Field({ matchPlayers, homeTeam, awayTeam, selectedPlayerId, onSelect, disabled }: FieldProps) {
  const placements = useMemo(() => {
    const home = placePlayersForSide(matchPlayers, homeTeam.id, 'home')
    const away = placePlayersForSide(matchPlayers, awayTeam.id, 'away')
    return [...home, ...away]
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
        className="relative mx-auto aspect-[3/4] w-full max-w-[480px] overflow-hidden rounded-[1.6rem] border border-white/30 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 36px, transparent 36px 72px), linear-gradient(180deg, #1f7a3a 0%, #145c2c 100%)',
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/60" />
          <div className="absolute left-1/2 top-0 h-[18%] w-[55%] -translate-x-1/2 border-2 border-t-0 border-white/60" />
          <div className="absolute left-1/2 bottom-0 h-[18%] w-[55%] -translate-x-1/2 border-2 border-b-0 border-white/60" />
          <div className="absolute left-1/2 top-0 h-[8%] w-[28%] -translate-x-1/2 border-2 border-t-0 border-white/60" />
          <div className="absolute left-1/2 bottom-0 h-[8%] w-[28%] -translate-x-1/2 border-2 border-b-0 border-white/60" />
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
            Remplacants entres en jeu
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
                  <span className={`relative block h-7 w-7 overflow-hidden rounded-full ${ring}`}>
                    {mp.player.image ? (
                      <img src={mp.player.image} alt={mp.player.name} className="h-full w-full object-cover" loading="lazy" />
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
