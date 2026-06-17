'use client'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import type { WCMatch } from '@/lib/wc-types'

dayjs.locale('vi')

interface Props {
  match: WCMatch
  onClick?: () => void
}

export default function MatchCard({ match, onClick }: Props) {
  const isLive = match.status === 'LIVE'
  const isFinished = match.status === 'FINISHED'
  const hasScore = match.homeScore !== null && match.awayScore !== null
  const isGroupStage = match.round === 'Group Stage'
  const dt = dayjs(match.date)

  const homeWin = isFinished && hasScore && match.homeScore! > match.awayScore!
  const awayWin = isFinished && hasScore && match.awayScore! > match.homeScore!

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-white/15 hover:bg-white/4' : ''
      } ${isLive ? 'border-green-500/30 bg-green-500/4' : 'border-white/8 bg-white/2'}`}
    >
      {/* Top row: group/round info + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isGroupStage && match.group && (
            <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/6 text-zinc-400">
              Bảng {match.group}
            </span>
          )}
          {match.venue && (
            <span className="text-[11px] text-zinc-600 truncate">{match.venue}</span>
          )}
          {!match.venue && !isGroupStage && (
            <span className="text-[11px] text-zinc-600">{match.round}</span>
          )}
        </div>

        {isLive ? (
          <span className="shrink-0 flex items-center gap-1.5 text-green-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {match.minute}'
          </span>
        ) : isFinished ? (
          <span className="shrink-0 text-[11px] text-zinc-600 font-bold">KT</span>
        ) : (
          <span className="shrink-0 text-[11px] text-zinc-500 font-medium">{dt.format('HH:mm')}</span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {match.homeTeam.logo && (
            <img src={match.homeTeam.logo} alt="" className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" />
          )}
          <span className={`text-xs sm:text-sm font-semibold leading-tight truncate ${homeWin ? 'text-white' : 'text-zinc-400'}`}>
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score / time */}
        <div className="shrink-0 text-center min-w-[52px] sm:min-w-[60px]">
          {hasScore ? (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span className={`text-lg sm:text-xl font-black tabular-nums ${homeWin ? 'text-white' : 'text-zinc-300'}`}>
                {match.homeScore}
              </span>
              <span className="text-zinc-700 text-sm sm:text-base">–</span>
              <span className={`text-lg sm:text-xl font-black tabular-nums ${awayWin ? 'text-white' : 'text-zinc-300'}`}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-zinc-500 text-[10px] sm:text-xs font-bold">{dt.format('DD/MM')}</span>
              <span className="text-zinc-400 text-xs sm:text-sm font-bold">{dt.format('HH:mm')}</span>
            </div>
          )}
          {isFinished && match.homePenalty !== null && match.awayPenalty !== null && (
            <div className="text-[9px] sm:text-[10px] text-zinc-600 mt-0.5 tabular-nums">
              ({match.homePenalty}–{match.awayPenalty})
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className={`text-xs sm:text-sm font-semibold leading-tight text-right truncate ${awayWin ? 'text-white' : 'text-zinc-400'}`}>
            {match.awayTeam.name}
          </span>
          {match.awayTeam.logo && (
            <img src={match.awayTeam.logo} alt="" className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
