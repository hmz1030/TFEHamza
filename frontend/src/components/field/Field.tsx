import { useMemo } from 'react'
import bootIcon from '../../assets/boot.png'
import footballIcon from '../../assets/football.png'
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
  DF: 80,
  MF: 68,
  FW: 58, // Écarté du centre
}

const AWAY_LINE_X: Record<PositionLabel, number> = {
  GK: 6,
  DF: 20,
  MF: 32,
  FW: 42, // Écarté du centre
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
  matchPlayer: MatchPlayer
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

  const grouped = new Map<PositionLabel, MatchPlayer[]>()
  POSITION_LABELS.forEach((label) => grouped.set(label, []))

  sortedStarters.forEach((mp, index) => {
    const label = normalizePosition(mp.player.position) ?? fallbackFormation[index] ?? 'MF'
    grouped.get(label)!.push(mp)
  })

  const xMap = side === 'home' ? HOME_LINE_X : AWAY_LINE_X
  const placed: PlacedPlayer[] = []

  POSITION_LABELS.forEach((label) => {
    const lineup = grouped.get(label) ?? []
    const count = lineup.length

    if (count === 0) return

    lineup
      .slice()
      .sort((a, b) => (a.player.number ?? 999) - (b.player.number ?? 999))
      .forEach((matchPlayer, index) => {
        const y = ((index + 1) * 100) / (count + 1)

        placed.push({
          matchPlayer,
          player: matchPlayer.player,
          x: xMap[label],
          y,
          side,
          isStarter: true,
        })
      })
  })

  return placed
}

type EventBadgeType = 'goal' | 'assist' | 'sub-in' | 'sub-out'

const EVENT_BADGE_STYLES: Record<EventBadgeType, string> = {
  goal: 'bg-white text-slate-950 ring-black/25',
  assist: 'bg-amber-300 text-slate-950 ring-black/25',
  'sub-in': 'bg-emerald-500 text-white ring-white/25',
  'sub-out': 'bg-red-500 text-white ring-white/25',
}

function EventIcon({ type }: { type: EventBadgeType }) {
  if (type === 'goal') {
    return (
      <img src={footballIcon} alt="" aria-hidden="true" className="h-3 w-3 object-contain" />
    )
  }

  if (type === 'assist') {
    return (
      <img src={bootIcon} alt="" aria-hidden="true" className="h-3 w-3 object-contain" />
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3">
      <path
        d={
          type === 'sub-in'
            ? 'M12 4 5.5 10.5h4V20h5v-9.5h4L12 4Z'
            : 'M12 20 5.5 13.5h4V4h5v9.5h4L12 20Z'
        }
        fill="currentColor"
      />
    </svg>
  )
}

function EventBadge({
  type,
  label,
  count,
}: {
  type: EventBadgeType
  label: string
  count?: number
}) {
  return (
    <span
      title={label}
      className={`flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[8px] font-black leading-none ring-1 shadow ${EVENT_BADGE_STYLES[type]}`}
    >
      <EventIcon type={type} />
      {count && count > 2 ? <span className="ml-0.5">x{count}</span> : null}
    </span>
  )
}

function CountBadges({
  type,
  count,
  label,
}: {
  type: EventBadgeType
  count: number
  label: string
}) {
  if (count <= 0) return null

  if (count > 2) {
    return <EventBadge type={type} label={label} count={count} />
  }

  return Array.from({ length: count }, (_, index) => (
    <EventBadge key={`${type}-${index}`} type={type} label={label} />
  ))
}

function PlayerEventBadges({
  matchPlayer,
  compact = false,
}: {
  matchPlayer: MatchPlayer
  compact?: boolean
}) {
  const goals = matchPlayer.goals ?? 0
  const assists = matchPlayer.assists ?? 0
  const hasSubs = matchPlayer.subbed_in || matchPlayer.subbed_out

  if (!goals && !assists && !hasSubs) return null

  const scale = compact ? 'scale-90' : ''

  return (
    <span className={`pointer-events-none absolute inset-0 ${scale}`}>
      <span className="absolute -top-2 -right-2 flex gap-0.5">
        <CountBadges type="goal" count={goals} label={`${goals} but${goals > 1 ? 's' : ''}`} />
      </span>

      <span className="absolute -top-2 -left-2 flex gap-0.5">
        <CountBadges
          type="assist"
          count={assists}
          label={`${assists} passe${assists > 1 ? 's' : ''} decisive${assists > 1 ? 's' : ''}`}
        />
      </span>

      <span className="absolute -bottom-2 -left-2 flex gap-0.5">
        {matchPlayer.subbed_in ? <EventBadge type="sub-in" label="Entre en jeu" /> : null}
        {matchPlayer.subbed_out ? <EventBadge type="sub-out" label="Sorti du terrain" /> : null}
      </span>
    </span>
  )
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
  const { matchPlayer, player, x, y, side } = placement

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
      // Sur mobile : X = top, Y = left. Sur PC (md:) : X = left, Y = top.
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col 
      items-center gap-1 outline-none disabled:cursor-not-allowed left-[var(--pos-y)] 
      top-[var(--pos-x)] md:left-[var(--pos-x)] md:top-[var(--pos-y)]"
      style={{
        '--pos-x': `${x}%`,
        '--pos-y': `${y}%`,
      } as React.CSSProperties}
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

        <PlayerEventBadges matchPlayer={matchPlayer} />
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

      <div className="relative mx-auto aspect-[3/4] md:aspect-[4/3] w-full max-w-[760px] overflow-hidden rounded-[1.6rem] border border-white/30 shadow-[0_24px_60px_rgba(0,0,0,0.45)] bg-[#145c2c]">
        
        {/* Background Pelouse Mobile (Vertical - de haut en bas) */}
        <div 
          className="absolute inset-0 block md:hidden"
          style={{ background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 36px, transparent 36px 72px), linear-gradient(180deg, #1f7a3a 0%, #145c2c 100%)' }}
        />
        
        {/* Background Pelouse PC (Horizontal - de gauche à droite) */}
        <div 
          className="absolute inset-0 hidden md:block"
          style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 36px, transparent 36px 72px), linear-gradient(90deg, #1f7a3a 0%, #145c2c 100%)' }}
        />

        {/* LIGNES DU TERRAIN */}
        <div className="pointer-events-none absolute inset-0">
          {/* Ligne centrale */}
          <div className="absolute bg-white/60 left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 md:bottom-0 md:left-1/2 md:top-0 md:h-auto md:w-[2px] md:-translate-x-1/2 md:translate-y-0" />

          {/* Cercle central */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60 h-[18%] w-[30%] md:h-[30%] md:w-[18%]" />

          {/* Surface Away (Haut sur mobile, Gauche sur PC) */}
          <div className="absolute top-0 left-1/2 w-[56%] h-[18%] -translate-x-1/2 border-2 border-t-0 border-white/60 md:left-0 md:top-1/2 md:h-[56%] md:w-[18%] md:-translate-y-1/2 md:translate-x-0 md:border-l-0 md:border-t-2" />
          
          <div className="absolute bottom-0 left-1/2 w-[56%] h-[18%] -translate-x-1/2 border-2 border-b-0 border-white/60 md:left-auto md:right-0 md:bottom-auto md:top-1/2 md:h-[56%] md:w-[18%] md:-translate-y-1/2 md:translate-x-0 md:border-r-0 md:border-b-2" />

          {/* 6 mètres Away */}
          <div className="absolute top-0 left-1/2 w-[28%] h-[8%] -translate-x-1/2 border-2 border-t-0 border-white/60 md:left-0 md:top-1/2 md:h-[28%] md:w-[8%] md:-translate-y-1/2 md:translate-x-0 md:border-l-0 md:border-t-2" />
          
          <div className="absolute bottom-0 left-1/2 w-[28%] h-[8%] -translate-x-1/2 border-2 border-b-0 border-white/60 md:left-auto md:right-0 md:bottom-auto md:top-1/2 md:h-[28%] md:w-[8%] md:-translate-y-1/2 md:translate-x-0 md:border-r-0 md:border-b-2" />

          {/* But Away */}
          <div className="absolute top-0 left-1/2 w-[18%] h-[2px] -translate-x-1/2 bg-white/80 md:left-0 md:top-1/2 md:h-[18%] md:w-[2px] md:-translate-y-1/2 md:translate-x-0" />
          
          <div className="absolute bottom-0 left-1/2 w-[18%] h-[2px] -translate-x-1/2 bg-white/80 md:left-auto md:right-0 md:bottom-auto md:top-1/2 md:h-[18%] md:w-[2px] md:-translate-y-1/2 md:translate-x-0" />
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
                    className={`relative block h-7 w-7 overflow-visible rounded-full ${ring}`}
                  >
                    <span className="block h-full w-full overflow-hidden rounded-full">
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
                    <PlayerEventBadges matchPlayer={mp} compact />
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
