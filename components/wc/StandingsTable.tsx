'use client'
import type { WCStanding } from '@/lib/wc-types'
import { teamMatchesQuery } from '@/lib/wc-teams-vi'

interface Props {
  standings: WCStanding[]
  teamFilter?: string
}

export default function StandingsTable({ standings, teamFilter = '' }: Props) {
  const hasFilter = teamFilter.trim().length > 0

  const groups = standings.reduce<Record<string, WCStanding[]>>((acc, s) => {
    const g = s.group
    if (!acc[g]) acc[g] = []
    acc[g].push(s)
    return acc
  }, {})

  // When filtering: only show groups that contain a matching team
  const groupKeys = Object.keys(groups).sort().filter((g) => {
    if (!hasFilter) return true
    return groups[g].some((s) => teamMatchesQuery(s.team.name, teamFilter))
  })

  if (groupKeys.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="text-4xl">🔍</span>
        <p className="text-zinc-400 font-semibold">Không tìm thấy đội nào</p>
        <p className="text-zinc-600 text-sm">Thử tên tiếng Anh hoặc tiếng Việt</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {groupKeys.map((g) => {
        const rows = hasFilter
          ? groups[g] // show all teams in group, just highlight the match
          : groups[g]

        return (
          <div key={g} className="rounded-2xl border border-white/6 overflow-hidden">
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/3 border-b border-white/6">
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Bảng {g}</span>
            </div>
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="text-zinc-600 border-b border-white/4">
                  <th className="text-left font-semibold pl-2 sm:pl-3 pr-1 py-2 w-8">#</th>
                  <th className="text-left font-semibold px-1 py-2">Đội</th>
                  <th className="hidden sm:table-cell font-semibold py-2 text-center w-10">Thắng</th>
                  <th className="hidden sm:table-cell font-semibold py-2 text-center w-8">Hòa</th>
                  <th className="hidden sm:table-cell font-semibold py-2 text-center w-8">Thua</th>
                  <th className="font-semibold py-2 text-center w-10">Trận</th>
                  <th className="hidden sm:table-cell font-semibold py-2 text-center w-14">Hiệu số</th>
                  <th className="font-semibold py-2 text-center w-10 text-orange-400">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => {
                  const isMatch = hasFilter && teamMatchesQuery(s.team.name, teamFilter)
                  return (
                    <tr
                      key={s.team.id}
                      className={`border-b border-white/3 last:border-0 transition-colors ${
                        isMatch
                          ? 'bg-orange-500/8 border-orange-500/10'
                          : hasFilter
                            ? 'opacity-30'
                            : 'hover:bg-white/3'
                      }`}
                    >
                      <td className="pl-2 sm:pl-3 pr-1 py-2 sm:py-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          i === 0 ? 'bg-amber-400/20 text-amber-400' :
                          i === 1 ? 'bg-zinc-700/60 text-zinc-300' :
                          'text-zinc-600'
                        }`}>
                          {s.position}
                        </span>
                      </td>
                      <td className="px-1 py-2 sm:py-2.5">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {s.team.logo && (
                            <img src={s.team.logo} alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                          )}
                          <span className={`font-semibold truncate ${isMatch ? 'text-white' : 'text-zinc-200'}`}>
                            {s.team.name}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell py-2.5 text-center text-zinc-400">{s.won}</td>
                      <td className="hidden sm:table-cell py-2.5 text-center text-zinc-400">{s.draw}</td>
                      <td className="hidden sm:table-cell py-2.5 text-center text-zinc-400">{s.lost}</td>
                      <td className="py-2 sm:py-2.5 text-center text-zinc-500">{s.playedGames}</td>
                      <td className="hidden sm:table-cell py-2.5 text-center text-zinc-500">
                        {s.goalsFor}:{s.goalsAgainst}
                      </td>
                      <td className="py-2 sm:py-2.5 text-center font-black text-orange-400">{s.points}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
