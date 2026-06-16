import type { Player } from '../../types'

export interface MvpCardPlayer extends Player {
  total: number
  goals: number
  assists: number
  clubLogo: string
  clubName: string
}

function MvpFutCard({ player, rank }: { player: MvpCardPlayer; rank: number }) {
  const themes = [
    { top: '#fff0ae', middle: '#e4b43b', bottom: '#ab7423', text: '#4c3510' },
    { top: '#f4f7f5', middle: '#c3cbc5', bottom: '#81908b', text: '#3c4037' },
    { top: '#f4bd7a', middle: '#c47a35', bottom: '#7b421d', text: '#3d2412' },
  ]
  const theme = themes[rank] ?? themes[0]
  const gradientId = `mvp-card-gradient-${rank}`
  const shineId = `mvp-card-shine-${rank}`
  const cardPath = 'M265 54c-14 0-29-7-34-22-1-4-1-8-2-10-27-13-60-21-96-21S64 9 37 22c-1 2-1 6-2 10-5 15-20 22-34 22-1 0-1 1-1 2v295c0 17 8 26 24 31 36 11 81 24 109 45 28-21 73-34 109-45 16-5 24-14 24-31V56c0-1 0-2-1-2Z'

  return (
    <article className="group relative mx-auto h-[18.7rem] w-[11.7rem] transition duration-300 hover:-translate-y-1 sm:h-[19.4rem] sm:w-[12.15rem]">
      <svg
        viewBox="0 0 267 427"
        className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_24px_34px_rgba(0,0,0,0.36)] transition duration-300 group-hover:drop-shadow-[0_30px_42px_rgba(0,0,0,0.45)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="38" y1="14" x2="235" y2="386" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={theme.top} />
            <stop offset="0.52" stopColor={theme.middle} />
            <stop offset="1" stopColor={theme.bottom} />
          </linearGradient>
          <radialGradient id={shineId} cx="39%" cy="16%" r="54%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={cardPath} fill={`url(#${gradientId})`} />
        <path d={cardPath} fill={`url(#${shineId})`} />
        <path d={cardPath} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="2" />
      </svg>

      <div className="relative z-10 h-full px-5 pb-8 pt-9" style={{ color: theme.text }}>
        <div className="absolute left-6 top-10 flex w-12 flex-col items-center text-center">
          <p className="text-3xl font-black leading-none">{player.total}</p>
          <p className="mt-0.5 text-[0.58rem] font-black uppercase tracking-[0.12em]">vote{player.total > 1 ? 's' : ''}</p>
          <div className="my-1.5 h-px w-9 bg-black/16" />
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em]">{player.position || 'J'}</p>
          <div className="mt-2 flex h-8 w-8 items-center justify-center p-1">
            {player.clubLogo ? (
              <img
                src={player.clubLogo}
                alt={`Logo ${player.clubName}`}
                className="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.24)]"
                loading="lazy"
              />
            ) : null}
          </div>
        </div>

        <span className="absolute right-6 top-11 rounded-full bg-black/10 px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em]">
          #{rank + 1}
        </span>

        <div
          className="absolute left-[57%] top-[5.35rem] flex h-[6.25rem] w-[6.25rem] -translate-x-1/2 items-end justify-center overflow-hidden rounded-[0.2rem] shadow-[0_10px_20px_rgba(0,0,0,0.14)]"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${theme.top} 0%, ${theme.middle} 58%, ${theme.bottom} 115%)`,
          }}
        >
          {player.image ? (
            <img
              src={player.image}
              alt={player.name}
              className="h-full w-full object-contain object-bottom mix-blend-multiply contrast-[1.06] saturate-[1.08]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-black/10 text-4xl font-black">
              {player.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="absolute inset-x-7 bottom-[5rem] border-y border-black/14 py-1.5 text-center">
          <h3 className="truncate text-lg font-black uppercase tracking-[0.035em]">{player.name}</h3>
        </div>

        <dl className="absolute inset-x-6 bottom-[1.95rem] grid grid-cols-3 divide-x divide-black/14 text-center">
          <div>
            <dt className="text-base font-black leading-none">{player.goals}</dt>
            <dd className="mt-1 text-[0.52rem] font-black uppercase tracking-[0.12em]">Buts</dd>
          </div>
          <div>
            <dt className="text-base font-black leading-none">{player.assists}</dt>
            <dd className="mt-1 text-[0.52rem] font-black uppercase tracking-[0.12em]">Passes</dd>
          </div>
          <div>
            <dt className="text-base font-black leading-none">{player.total}</dt>
            <dd className="mt-1 text-[0.52rem] font-black uppercase tracking-[0.12em]">Votes</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

export default MvpFutCard
