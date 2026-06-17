'use client'
import { useQuery } from '@tanstack/react-query'
import type { WCScorer } from '@/lib/wc-types'

const TEAM_ISO: Record<string, string> = {
  'Germany': 'de', 'France': 'fr', 'Spain': 'es', 'Portugal': 'pt',
  'Netherlands': 'nl', 'Belgium': 'be', 'Italy': 'it', 'England': 'gb-eng',
  'Croatia': 'hr', 'Denmark': 'dk', 'Austria': 'at', 'Switzerland': 'ch',
  'Poland': 'pl', 'Ukraine': 'ua', 'Serbia': 'rs', 'Hungary': 'hu',
  'Slovakia': 'sk', 'Czechia': 'cz', 'Czech Republic': 'cz', 'Romania': 'ro',
  'Scotland': 'gb-sct', 'Wales': 'gb-wls', 'Turkey': 'tr', 'Georgia': 'ge',
  'Slovenia': 'si', 'Greece': 'gr', 'Albania': 'al', 'Norway': 'no',
  'Sweden': 'se', 'Finland': 'fi', 'Iceland': 'is', 'Russia': 'ru',
  'Bosnia and Herzegovina': 'ba', 'Bosnia-Herzegovina': 'ba', 'Montenegro': 'me',
  'North Macedonia': 'mk', 'Kosovo': 'xk', 'Luxembourg': 'lu', 'Ireland': 'ie',
  'Brazil': 'br', 'Argentina': 'ar', 'Uruguay': 'uy', 'Colombia': 'co',
  'Chile': 'cl', 'Peru': 'pe', 'Ecuador': 'ec', 'Paraguay': 'py',
  'Bolivia': 'bo', 'Venezuela': 've',
  'United States': 'us', 'Mexico': 'mx', 'Canada': 'ca', 'Costa Rica': 'cr',
  'Panama': 'pa', 'Honduras': 'hn', 'Jamaica': 'jm', 'El Salvador': 'sv',
  'Trinidad and Tobago': 'tt', 'Guatemala': 'gt', 'Cuba': 'cu', 'Haiti': 'ht',
  'Morocco': 'ma', 'Senegal': 'sn', 'Nigeria': 'ng', 'Ghana': 'gh',
  "Côte d'Ivoire": 'ci', "Ivory Coast": 'ci', 'Cameroon': 'cm', 'Tunisia': 'tn',
  'Egypt': 'eg', 'Algeria': 'dz', 'South Africa': 'za', 'Mali': 'ml',
  'Burkina Faso': 'bf', 'Guinea': 'gn', 'DR Congo': 'cd', 'Congo': 'cg',
  'Tanzania': 'tz', 'Uganda': 'ug', 'Zambia': 'zm', 'Zimbabwe': 'zw',
  'Cape Verde': 'cv', 'Mozambique': 'mz', 'Rwanda': 'rw', 'Angola': 'ao',
  'Japan': 'jp', 'South Korea': 'kr', 'Australia': 'au', 'Iran': 'ir',
  'Saudi Arabia': 'sa', 'Qatar': 'qa', 'Iraq': 'iq', 'Jordan': 'jo',
  'Oman': 'om', 'Bahrain': 'bh', 'Kuwait': 'kw', 'UAE': 'ae',
  'China': 'cn', 'Indonesia': 'id', 'Thailand': 'th', 'Vietnam': 'vn',
  'India': 'in', 'New Zealand': 'nz', 'Philippines': 'ph',
}

// Emoji flag from ISO2 code — built into OS, zero network request
function isoToEmoji(iso: string): string {
  const code = iso.includes('-') ? iso.split('-')[0] : iso  // gb-eng → gb
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
}

function teamFlag(teamName: string): string | null {
  const iso = TEAM_ISO[teamName]
  return iso ? isoToEmoji(iso) : null
}

async function fetchScorers(season: string): Promise<WCScorer[]> {
  const res = await fetch(`/api/wc/scorers?season=${season}&limit=20`)
  if (!res.ok) return []
  return res.json()
}

interface Props { season: string }

export default function ScorersTable({ season }: Props) {
  const { data: scorers = [], isLoading } = useQuery({
    queryKey: ['wc-scorers', season],
    queryFn: () => fetchScorers(season),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="spinner" /></div>
  }

  if (scorers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl">⚽</span>
        <p className="text-zinc-500 text-sm">Chưa có dữ liệu ghi bàn</p>
      </div>
    )
  }

  const sorted = [...scorers].sort((a, b) =>
    b.goals !== a.goals ? b.goals - a.goals : (b.assists ?? 0) - (a.assists ?? 0),
  )

  return (
    <div className="rounded-2xl border border-white/6 overflow-hidden">
      <table className="w-full text-xs table-fixed">
        <thead>
          <tr className="text-zinc-600 border-b border-white/6 bg-white/3">
            <th className="text-left font-semibold pl-3 sm:pl-4 pr-2 py-3 w-8">#</th>
            <th className="text-left font-semibold px-1 py-3">Cầu thủ</th>
            <th className="hidden sm:table-cell font-semibold py-3 text-center w-36">Đội</th>
            <th className="font-semibold py-3 text-center w-12 text-orange-400">Bàn</th>
            <th className="hidden sm:table-cell font-semibold py-3 text-center w-14">Kiến tạo</th>
            <th className="hidden sm:table-cell font-semibold py-3 text-center w-14">Penalty</th>
            <th className="font-semibold py-3 text-center w-12 text-zinc-500">Trận</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const isTop = i === 0
            const isSame = i > 0 && sorted[i - 1].goals === s.goals
            const rank = isSame ? sorted.findIndex((x) => x.goals === s.goals) + 1 : i + 1
            const flag = teamFlag(s.team.name)

            return (
              <tr
                key={s.player.id}
                className="border-b border-white/3 last:border-0 hover:bg-white/3 transition-colors"
              >
                <td className="pl-3 sm:pl-4 pr-2 py-2.5 sm:py-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    rank === 1 ? 'bg-amber-400/20 text-amber-400' :
                    rank === 2 ? 'bg-zinc-700/60 text-zinc-300' :
                    rank === 3 ? 'bg-orange-900/40 text-orange-400' :
                    'text-zinc-600'
                  }`}>
                    {rank}
                  </span>
                </td>
                <td className="px-1 py-2.5 sm:py-3">
                  <div className="flex flex-col min-w-0">
                    <span className={`font-bold truncate ${isTop ? 'text-white' : 'text-zinc-200'}`}>
                      {s.player.name}
                    </span>
                    {/* Mobile: flag emoji + team name below player name */}
                    <div className="flex items-center gap-1 mt-0.5 sm:hidden">
                      {flag && <span className="text-sm leading-none shrink-0">{flag}</span>}
                      <span className="text-zinc-500 text-[10px] truncate">{s.team.name}</span>
                    </div>
                  </div>
                </td>
                {/* Desktop: flag emoji + team name */}
                <td className="hidden sm:table-cell py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 px-1">
                    {flag && <span className="text-base leading-none shrink-0">{flag}</span>}
                    <span className="text-zinc-400 text-left leading-tight">{s.team.name}</span>
                  </div>
                </td>
                <td className="py-2.5 sm:py-3 text-center">
                  <span className={`font-black text-base ${isTop ? 'text-orange-400' : 'text-zinc-200'}`}>
                    {s.goals}
                  </span>
                </td>
                <td className="hidden sm:table-cell py-3 text-center text-zinc-500">
                  {s.assists ?? <span className="text-zinc-700">–</span>}
                </td>
                <td className="hidden sm:table-cell py-3 text-center text-zinc-600">
                  {s.penalties ? (
                    <span title="Trong đó có penalty" className="text-zinc-500">{s.penalties}</span>
                  ) : (
                    <span className="text-zinc-700">–</span>
                  )}
                </td>
                <td className="py-2.5 sm:py-3 text-center text-zinc-600">{s.playedMatches}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
