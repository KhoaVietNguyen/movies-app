'use client'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { WCFixtureDetail, WCEvent, WCMatch } from '@/lib/wc-types'
import HighlightPlayer from './HighlightPlayer'

async function fetchFixture(id: number): Promise<WCFixtureDetail | null> {
  const res = await fetch(`/api/wc/fixture/${id}`)
  if (!res.ok) return null
  return res.json()
}

const EVENT_ICON: Record<string, string> = {
  Goal: '⚽',
  Card: '🟨',
  Subst: '🔄',
  Var: '📺',
  Other: '•',
}

function EventRow({ event, homeId }: { event: WCEvent; homeId: number }) {
  const isHome = event.teamId === homeId
  const icon = event.detail === 'Red Card' ? '🟥' : event.detail === 'Yellow Card' ? '🟨' : EVENT_ICON[event.type] ?? '•'
  return (
    <div className={`flex items-center gap-2 py-1 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
      <span className="text-zinc-600 text-[11px] tabular-nums w-8 shrink-0 text-center">
        {event.minute}{event.extraMinute ? `+${event.extraMinute}` : ''}'
      </span>
      <span className="text-sm">{icon}</span>
      <div className={`flex flex-col ${isHome ? '' : 'items-end'}`}>
        <span className="text-zinc-200 text-[12px] font-semibold leading-tight">{event.player}</span>
        {event.assist && <span className="text-zinc-600 text-[10px]">↳ {event.assist}</span>}
      </div>
    </div>
  )
}

// ESPN boxscore stat name → Vietnamese label, in display order.
const STAT_LABELS: { key: string; label: string; pct?: boolean }[] = [
  { key: 'possessionPct', label: 'Kiểm soát bóng', pct: true },
  { key: 'totalShots', label: 'Dứt điểm' },
  { key: 'shotsOnTarget', label: 'Trúng đích' },
  { key: 'wonCorners', label: 'Phạt góc' },
  { key: 'offsides', label: 'Việt vị' },
  { key: 'foulsCommitted', label: 'Phạm lỗi' },
  { key: 'yellowCards', label: 'Thẻ vàng' },
  { key: 'saves', label: 'Cứu thua' },
]

function StatsBlock({ home, away }: { home?: Record<string, string | number>; away?: Record<string, string | number> }) {
  const rows = STAT_LABELS.filter((s) => home?.[s.key] != null || away?.[s.key] != null)
  if (rows.length === 0) return null

  return (
    <div className="border-t border-white/6 pt-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Thống kê</p>
      <div className="space-y-2.5">
        {rows.map((s) => {
          const h = Number(home?.[s.key] ?? 0)
          const a = Number(away?.[s.key] ?? 0)
          const total = h + a
          const hPct = total > 0 ? (h / total) * 100 : 50
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-zinc-300 tabular-nums">{home?.[s.key] ?? 0}{s.pct ? '%' : ''}</span>
                <span className="text-zinc-600">{s.label}</span>
                <span className="font-bold text-zinc-300 tabular-nums">{away?.[s.key] ?? 0}{s.pct ? '%' : ''}</span>
              </div>
              <div className="flex h-1 gap-0.5">
                <div className="bg-orange-500/70 rounded-l-full" style={{ width: `${hPct}%` }} />
                <div className="bg-white/15 rounded-r-full flex-1" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  match: WCMatch
  onClose: () => void
}

export default function FixtureDetail({ match, onClose }: Props) {
  const { data: detail, isLoading } = useQuery({
    queryKey: ['wc-fixture', match.id],
    queryFn: () => fetchFixture(match.id),
    staleTime: 60 * 1000,
  })

  const hasScore = match.homeScore !== null && match.awayScore !== null
  const dt = dayjs(match.date)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[85dvh] rounded-t-2xl sm:rounded-2xl bg-[#111115] border border-white/8 overflow-y-auto no-scrollbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center text-sm transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        <div className="p-5 pt-8 sm:pt-5 space-y-5">
          {/* Round / group label */}
          <div className="text-center text-zinc-600 text-xs">
            {match.round}{match.group ? ` · Bảng ${match.group}` : ''}
            {match.venue && <span className="text-zinc-700"> · {match.venue}</span>}
          </div>

          {/* Teams + score — always from match prop (correct) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 flex flex-col items-center gap-2">
              {match.homeTeam.logo && (
                <img src={match.homeTeam.logo} alt="" className="w-14 h-14 object-contain" />
              )}
              <span className="text-sm font-bold text-center text-white leading-tight">{match.homeTeam.name}</span>
            </div>

            <div className="shrink-0 text-center min-w-[80px]">
              {hasScore ? (
                <>
                  <div className="text-4xl font-black tabular-nums text-white">
                    {match.homeScore} – {match.awayScore}
                  </div>
                  {match.homePenalty !== null && match.awayPenalty !== null && (
                    <div className="text-zinc-500 text-xs mt-1">(pen {match.homePenalty} – {match.awayPenalty})</div>
                  )}
                  <div className="text-zinc-600 text-xs mt-1">
                    {match.status === 'LIVE' ? `${match.minute}'` : match.status === 'FINISHED' ? 'Kết thúc' : ''}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-zinc-500 text-xs">{dt.format('DD/MM/YYYY')}</span>
                  <span className="text-zinc-300 text-lg font-bold">{dt.format('HH:mm')}</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              {match.awayTeam.logo && (
                <img src={match.awayTeam.logo} alt="" className="w-14 h-14 object-contain" />
              )}
              <span className="text-sm font-bold text-center text-white leading-tight">{match.awayTeam.name}</span>
            </div>
          </div>

          {/* Highlight button */}
          <div className="flex justify-center">
            <HighlightPlayer match={match} />
          </div>

          {/* Detail section: events + stats + lineups */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="spinner-sm" />
            </div>
          )}

          {detail?.events && detail.events.length > 0 && (
            <div className="border-t border-white/6 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Diễn biến</p>
              <div className="space-y-0.5">
                {detail.events.map((e, i) => (
                  <EventRow key={i} event={e} homeId={match.homeTeam.id} />
                ))}
              </div>
            </div>
          )}

          {detail && (detail.homeStats || detail.awayStats) && (
            <StatsBlock home={detail.homeStats} away={detail.awayStats} />
          )}

          {detail?.lineups && detail.lineups.length === 2 && (
            <div className="border-t border-white/6 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Đội hình</p>
              <div className="grid grid-cols-2 gap-4">
                {detail.lineups.map((lineup) => {
                  const isHome = lineup.teamId === match.homeTeam.id
                  const team = isHome ? match.homeTeam : match.awayTeam
                  return (
                    <div key={lineup.teamId}>
                      <div className="flex items-center gap-1.5 mb-2">
                        {team.logo && <img src={team.logo} alt="" className="w-4 h-4 object-contain" />}
                        <span className="text-zinc-400 text-xs font-bold">{team.name}</span>
                        {lineup.formation && (
                          <span className="ml-auto text-zinc-600 text-[10px] font-mono">{lineup.formation}</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {lineup.startXI.map((p) => (
                          <div key={p.number} className="flex items-center gap-2 text-[11px]">
                            <span className="text-zinc-700 w-4 text-right tabular-nums shrink-0">{p.number}</span>
                            <span className="text-zinc-300 truncate">{p.name}</span>
                          </div>
                        ))}
                      </div>
                      {lineup.substitutes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/4 space-y-0.5">
                          {lineup.substitutes.map((p) => (
                            <div key={p.number} className="flex items-center gap-2 text-[11px]">
                              <span className="text-zinc-700 w-4 text-right tabular-nums shrink-0">{p.number}</span>
                              <span className="text-zinc-600 truncate">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!isLoading && detail && detail.events.length === 0 && detail.lineups.length === 0 && (
            <p className="text-zinc-700 text-xs text-center py-2">
              {match.status === 'SCHEDULED' ? 'Đội hình chưa được công bố' : 'Chưa có dữ liệu chi tiết'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
