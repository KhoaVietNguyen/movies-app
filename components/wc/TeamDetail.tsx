'use client'
import { useQuery } from '@tanstack/react-query'
import type { WCTeamDetail, WCPlayer, WCTeamInfo } from '@/lib/wc-types'

async function fetchTeam(id: number): Promise<WCTeamDetail | null> {
  const res = await fetch(`/api/wc/team/${id}`)
  if (!res.ok) return null
  return res.json()
}

async function fetchPhotos(id: number): Promise<Record<string, string>> {
  const res = await fetch(`/api/wc/team/${id}/photos`)
  if (!res.ok) return {}
  return res.json()
}

const POS_GROUPS: { key: string; label: string; codes: string[] }[] = [
  { key: 'G', label: 'Thủ môn', codes: ['G'] },
  { key: 'D', label: 'Hậu vệ', codes: ['D'] },
  { key: 'M', label: 'Tiền vệ', codes: ['M'] },
  { key: 'F', label: 'Tiền đạo', codes: ['F'] },
]

function PlayerRow({ p, photo }: { p: WCPlayer; photo?: string }) {
  const src = photo ?? p.headshot
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="w-6 shrink-0 text-center text-[11px] font-black tabular-nums text-zinc-500">
        {p.jersey ?? '–'}
      </span>
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-15 h-15 rounded-lg object-cover object-top bg-white/5 shrink-0 animate-[fadeIn_0.3s_ease]"
        />
      ) : (
        <span className="w-15 h-15 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-zinc-700">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
          </svg>
        </span>
      )}
      <span className="flex-1 min-w-0 truncate text-[13px] text-zinc-200">{p.name}</span>
      {p.age != null && <span className="shrink-0 text-[11px] text-zinc-600 tabular-nums">{p.age}t</span>}
    </div>
  )
}

interface Props {
  team: WCTeamInfo
  onClose: () => void
}

export default function TeamDetail({ team, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['wc-team', team.id],
    queryFn: () => fetchTeam(team.id),
    staleTime: 24 * 60 * 60 * 1000,
  })

  // Photos load separately so the roster list never waits on TheSportsDB.
  const { data: photos = {} } = useQuery({
    queryKey: ['wc-team-photos', team.id],
    queryFn: () => fetchPhotos(team.id),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const players = data?.players ?? []
  const grouped = POS_GROUPS
    .map((g) => ({ ...g, items: players.filter((p) => g.codes.includes(p.position)) }))
    .filter((g) => g.items.length > 0)
  const others = players.filter((p) => !['G', 'D', 'M', 'F'].includes(p.position))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[88dvh] rounded-t-2xl sm:rounded-2xl bg-[#111115] border border-white/8 overflow-y-auto no-scrollbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden sticky top-0 z-10 flex justify-center pt-2.5 pb-1 bg-[#111115]">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center text-sm transition-all cursor-pointer z-20"
        >
          ✕
        </button>

        {/* Header */}
        <div
          className="px-5 pt-4 pb-5 flex items-center gap-4 border-b border-white/6"
          style={team.color ? { background: `linear-gradient(135deg, ${team.color}22, transparent 70%)` } : undefined}
        >
          {team.logo && <img src={team.logo} alt="" className="w-16 h-16 object-contain shrink-0" />}
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white leading-tight truncate">{team.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {data?.standingSummary && (
                <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  {data.standingSummary}
                </span>
              )}
              {data?.record && (
                <span className="text-[11px] text-zinc-500 tabular-nums">{data.record} (T-H-B)</span>
              )}
            </div>
          </div>
        </div>

        {/* Roster */}
        <div className="px-4 sm:px-5 py-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="spinner-sm" /></div>
          ) : players.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-12">Chưa có danh sách cầu thủ</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Đội hình</span>
                <span className="text-[11px] text-zinc-600">{players.length} cầu thủ</span>
              </div>
              <div className="space-y-4">
                {grouped.map((g) => (
                  <div key={g.key}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-zinc-400">{g.label}</span>
                      <span className="text-[10px] text-zinc-700">{g.items.length}</span>
                      <div className="flex-1 h-px bg-white/6" />
                    </div>
                    <div className="divide-y divide-white/4">
                      {g.items.map((p) => <PlayerRow key={p.id} p={p} photo={photos[p.name]} />)}
                    </div>
                  </div>
                ))}
                {others.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-zinc-400">Khác</span>
                      <div className="flex-1 h-px bg-white/6" />
                    </div>
                    <div className="divide-y divide-white/4">
                      {others.map((p) => <PlayerRow key={p.id} p={p} photo={photos[p.name]} />)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
