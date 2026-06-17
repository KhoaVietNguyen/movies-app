'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { WCTeamInfo } from '@/lib/wc-types'
import { teamMatchesQuery } from '@/lib/wc-teams-vi'
import TeamDetail from './TeamDetail'

async function fetchTeams(): Promise<WCTeamInfo[]> {
  const res = await fetch('/api/wc/teams')
  if (!res.ok) return []
  return res.json()
}

interface Props { teamFilter: string }

export default function TeamsGrid({ teamFilter }: Props) {
  const [selected, setSelected] = useState<WCTeamInfo | null>(null)

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['wc-teams'],
    queryFn: fetchTeams,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const filtered = useMemo(() => {
    const q = teamFilter.trim()
    if (!q) return teams
    return teams.filter((t) => teamMatchesQuery(t.name, q))
  }, [teams, teamFilter])

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="text-4xl">🔍</span>
        <p className="text-zinc-400 font-semibold">Không tìm thấy đội nào</p>
        <p className="text-zinc-600 text-sm">Thử tên tiếng Anh hoặc tiếng Việt</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t)}
            className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-white/3 border border-white/6 hover:border-white/15 hover:bg-white/6 active:scale-95 transition-all cursor-pointer"
          >
            {t.logo ? (
              <img
                src={t.logo}
                alt=""
                loading="lazy"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform"
              />
            ) : (
              <span className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-zinc-700">🏳️</span>
            )}
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-300 text-center leading-tight line-clamp-2">
              {t.name}
            </span>
          </button>
        ))}
      </div>

      {selected && <TeamDetail team={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
