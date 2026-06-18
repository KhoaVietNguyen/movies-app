'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import type { WCMatch, WCStanding } from '@/lib/wc-types'
import { teamMatchesQuery } from '@/lib/wc-teams-vi'
import MatchCard from './MatchCard'
import { SearchIcon } from '@/components/icons'
import StandingsTable from './StandingsTable'
import ScorersTable from './ScorersTable'
import TeamsGrid from './TeamsGrid'
import FixtureDetail from './FixtureDetail'
import HighlightsTab from './HighlightsTab'

dayjs.locale('vi')

async function fetchMatches(season: string): Promise<WCMatch[]> {
  const res = await fetch(`/api/wc/matches?season=${season}`)
  if (!res.ok) return []
  return res.json()
}

async function fetchStandings(season: string): Promise<WCStanding[]> {
  const res = await fetch(`/api/wc/standings?season=${season}`)
  if (!res.ok) return []
  return res.json()
}

const ROUND_ORDER = [
  'Group Stage',
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  'Hạng 3',
  'Chung kết',
]

type SubTab = 'live' | 'matches' | 'highlights' | 'standings' | 'scorers' | 'teams'
type GroupView = 'date' | 'group'

export default function WCPage() {
  const [season, setSeason] = useState('2026')
  const [subTab, setSubTab] = useState<SubTab>('matches')
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  const [groupView, setGroupView] = useState<GroupView>('date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [teamFilter, setTeamFilter] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [openFixture, setOpenFixture] = useState<WCMatch | null>(null)
  const todayKey = dayjs().format('ddd, DD/MM/YYYY')

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['wc-matches', season],
    queryFn: () => fetchMatches(season),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Only auto-poll when there are live matches; server cache handles the rest
    refetchInterval: (query) => {
      const data: WCMatch[] = (query.state.data as WCMatch[]) ?? []
      return data.some((m) => m.status === 'LIVE') ? 30_000 : false
    },
  })

  const { data: standings = [], isLoading: standingsLoading } = useQuery({
    queryKey: ['wc-standings', season],
    queryFn: () => fetchStandings(season),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const hasTeamFilter = teamFilter.trim().length > 0

  // All matches for the active team filter (across all rounds)
  const teamFilteredMatches = useMemo(() => {
    if (!hasTeamFilter) return []
    return matches
      .filter((m) =>
        teamMatchesQuery(m.homeTeam.name, teamFilter) ||
        teamMatchesQuery(m.awayTeam.name, teamFilter),
      )
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [matches, teamFilter, hasTeamFilter])

  // Group matches by round, sorted by ROUND_ORDER
  const rounds = useMemo(() => {
    const map = new Map<string, WCMatch[]>()
    for (const m of matches) {
      if (!map.has(m.round)) map.set(m.round, [])
      map.get(m.round)!.push(m)
    }
    for (const [, arr] of map) arr.sort((a, b) => a.date.localeCompare(b.date))
    return [...map.entries()].sort(([a], [b]) => {
      const ai = ROUND_ORDER.indexOf(a)
      const bi = ROUND_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [matches])

  const roundKeys = rounds.map(([r]) => r)
  const activeRound = selectedRound ?? roundKeys[0] ?? null
  const activeMatches = rounds.find(([r]) => r === activeRound)?.[1] ?? []
  const isGroupStage = activeRound === 'Group Stage'

  // Group stage sections by date (chronological)
  const dateSections = useMemo(() => {
    if (!isGroupStage || hasTeamFilter) return []
    const map = new Map<string, WCMatch[]>()
    for (const m of activeMatches) {
      const key = dayjs(m.date).format('ddd, DD/MM/YYYY')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return [...map.entries()]
      .map(([key, ms]) => ({ key, matches: ms, isToday: key === todayKey, sortDate: ms[0].date }))
      .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
  }, [isGroupStage, activeMatches, hasTeamFilter, todayKey])

  // Group stage sections by group letter (skip matches ESPN mislabels as Group Stage but have no group)
  const groupSections = useMemo(() => {
    if (!isGroupStage || hasTeamFilter) return []
    const map = new Map<string, WCMatch[]>()
    for (const m of activeMatches) {
      if (!m.group) continue
      const key = `Bảng ${m.group}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return [...map.entries()]
      .map(([key, ms]) => ({ key, matches: ms }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [isGroupStage, activeMatches, hasTeamFilter])

  // Active section with graceful fallback (default: today for dates, first group)
  const activeDateSection =
    dateSections.find((s) => s.key === selectedDate) ??
    dateSections.find((s) => s.isToday) ??
    dateSections[0] ??
    null
  const activeGroupSection =
    groupSections.find((s) => s.key === selectedGroup) ?? groupSections[0] ?? null

  // Picker (date vs group) driven by the active groupView
  const pickerSections: { key: string; matches: WCMatch[]; isToday?: boolean }[] =
    groupView === 'date' ? dateSections : groupSections
  const activeSection: { key: string; matches: WCMatch[]; isToday?: boolean } | null =
    groupView === 'date' ? activeDateSection : activeGroupSection
  const selectSection = (key: string) => {
    if (groupView === 'date') setSelectedDate(key)
    else setSelectedGroup(key)
    setPickerOpen(false)
  }

  const liveMatches = matches.filter((m) => m.status === 'LIVE')
  const liveCount = liveMatches.length

  // Team filter: group filtered matches by round for display
  const teamFilteredByRound = useMemo(() => {
    if (!hasTeamFilter) return []
    const map = new Map<string, WCMatch[]>()
    for (const m of teamFilteredMatches) {
      if (!map.has(m.round)) map.set(m.round, [])
      map.get(m.round)!.push(m)
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = ROUND_ORDER.indexOf(a)
      const bi = ROUND_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [teamFilteredMatches, hasTeamFilter])

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            🏆 FIFA World Cup
            {liveCount > 0 && (
              <button
                type="button"
                onClick={() => setSubTab('live')}
                className="flex items-center gap-1 text-green-400 text-sm font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full hover:bg-green-500/20 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {liveCount} LIVE
              </button>
            )}
          </h1>
          <p className="text-zinc-600 text-xs mt-0.5">Dữ liệu từ api-football · football-data.org</p>
        </div>

        {/* Season selector */}
        <div className="flex items-center gap-1 bg-white/4 border border-white/8 rounded-xl p-1">
          {['2026', '2022'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setSeason(s); setSelectedRound(null); setTeamFilter(''); setSelectedDate(null); setSelectedGroup(null); setPickerOpen(false) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                season === s ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs + team search */}
      <div className="flex items-center gap-2 mb-5">
        {/* Tabs — horizontal scroll on mobile */}
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 bg-white/3 border border-white/6 rounded-xl p-1 w-fit">
            {(['live', 'matches', 'highlights', 'standings', 'scorers', 'teams'] as SubTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSubTab(t)}
                className={`shrink-0 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  subTab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                {t === 'live' ? 'Live' : t === 'matches' ? '📅 Lịch' : t === 'highlights' ? '🎬' : t === 'standings' ? '📊 BXH' : t === 'scorers' ? '⚽' : '👥'}
                <span className="hidden sm:inline">
                  {t === 'highlights' ? 'Highlight' : t === 'scorers' ? 'Vua Phá Lưới' : t === 'teams' ? 'Đội' : ''}
                </span>
                {t === 'live' && liveCount > 0 && (
                  <span className="text-[10px] font-black bg-green-500 text-white rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                    {liveCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Team search — compact icon on mobile, full input on desktop */}
        {(subTab === 'matches' || subTab === 'standings' || subTab === 'teams') && (
          <>
            {/* Mobile: icon button that expands to input when tapped */}
            <div className="sm:hidden shrink-0">
              {mobileSearchOpen ? (
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    onBlur={() => { if (!teamFilter) setMobileSearchOpen(false) }}
                    placeholder="Tìm đội..."
                    className="w-36 bg-white/6 border border-orange-500/40 rounded-xl pl-3 pr-7 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setTeamFilter(''); setMobileSearchOpen(false) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer text-xs"
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(true)}
                  aria-label="Tìm đội"
                  className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${hasTeamFilter ? 'bg-orange-500/15 border-orange-500/40 text-orange-400' : 'bg-white/4 border-white/8 text-zinc-500 hover:text-zinc-300 hover:border-white/18'}`}
                >
                  <SearchIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop: full search input */}
            <div className="hidden sm:block relative shrink-0 w-56">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                placeholder="Tìm đội... (VD: Đức, France)"
                className="w-full bg-white/4 border border-white/8 hover:border-white/15 focus:border-orange-500/50 focus:bg-white/6 rounded-xl pl-9 pr-8 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-all"
              />
              {hasTeamFilter && (
                <button
                  type="button"
                  onClick={() => setTeamFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer text-xs"
                >✕</button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Live tab */}
      {subTab === 'live' && (
        <>
          {matchesLoading ? (
            <div className="flex justify-center py-20"><div className="spinner" /></div>
          ) : liveMatches.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="text-4xl">🏟️</span>
              <p className="text-zinc-400 font-semibold">Không có trận nào đang diễn ra</p>
              <p className="text-zinc-600 text-sm">Dữ liệu cập nhật mỗi 60 giây</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {liveMatches.map((m) => (
                <MatchCard key={m.id} match={m} onClick={() => setOpenFixture(m)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Matches tab */}
      {subTab === 'matches' && (
        <>
          {matchesLoading ? (
            <div className="flex justify-center py-20"><div className="spinner" /></div>
          ) : hasTeamFilter ? (
            /* Team filter mode: show all rounds */
            teamFilteredMatches.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <span className="text-4xl">🔍</span>
                <p className="text-zinc-400 font-semibold">Không tìm thấy đội nào</p>
                <p className="text-zinc-600 text-sm">Thử tên tiếng Anh hoặc tiếng Việt</p>
              </div>
            ) : (
              <div className="space-y-8">
                {teamFilteredByRound.map(([round, roundMatches]) => (
                  <div key={round}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-black text-white tracking-tight">{round}</span>
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-[11px] font-bold text-zinc-400 bg-white/6 border border-white/8 px-2 py-0.5 rounded-full">
                        {roundMatches.length} trận
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {roundMatches.map((m) => (
                        <MatchCard key={m.id} match={m} onClick={() => setOpenFixture(m)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : rounds.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">Chưa có lịch thi đấu</div>
          ) : (
            <div>
              {/* Round selector — horizontal scrollable on mobile */}
              <div className="sm:hidden flex gap-1.5 overflow-x-auto pb-2 no-scrollbar mb-4 -mx-3 px-3">
                {roundKeys.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setSelectedRound(r); setSelectedDate(null); setSelectedGroup(null); setPickerOpen(false) }}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeRound === r
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/6 text-zinc-500 border border-white/8 hover:text-zinc-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex gap-5">
                {/* Round selector — vertical left on desktop */}
                <div className="hidden sm:flex flex-col gap-1 shrink-0 w-36">
                  {roundKeys.map((r) => {
                    const hasLive = rounds.find(([rr]) => rr === r)?.[1].some(m => m.status === 'LIVE')
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setSelectedRound(r); setSelectedDate(null); setSelectedGroup(null); setPickerOpen(false) }}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeRound === r
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/4'
                        }`}
                      >
                        {hasLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" />}
                        {r}
                      </button>
                    )
                  })}
                </div>

                {/* Match list */}
                <div className="flex-1 min-w-0">
                  {/* Group Stage view toggle */}
                  {isGroupStage && (
                    <div className="flex items-center gap-1 mb-4 bg-white/3 border border-white/6 rounded-xl p-1 w-fit">
                      <button
                        type="button"
                        onClick={() => { setGroupView('date'); setPickerOpen(false) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          groupView === 'date' ? 'bg-white/12 text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        📅 Theo ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGroupView('group'); setPickerOpen(false) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          groupView === 'group' ? 'bg-white/12 text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        🏆 Theo bảng
                      </button>
                    </div>
                  )}

                  {/* Group Stage: single section + dropdown picker */}
                  {isGroupStage ? (
                    activeSection ? (
                      <div>
                        {/* Picker label */}
                        <div className="relative mb-4 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPickerOpen((v) => !v)}
                            className="cursor-pointer"
                          >
                            {activeSection.isToday ? (
                              <span className="flex items-center gap-1.5 text-sm font-black text-zinc-900 tracking-tight px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-white shadow-lg shadow-orange-500/25">
                                ● HÔM NAY · {activeSection.key}
                                <span className={`text-sm leading-none transition-transform duration-200 opacity-60 ${pickerOpen ? 'rotate-180' : ''}`}>▾</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-sm font-black text-white tracking-tight">
                                {groupView === 'group' ? '🏆 ' : '📅 '}{activeSection.key}
                                <span className={`text-sm leading-none transition-transform duration-200 text-zinc-400 ${pickerOpen ? 'rotate-180' : ''}`}>▾</span>
                              </span>
                            )}
                          </button>
                          <span className="text-[11px] font-bold text-zinc-400 bg-white/6 border border-white/8 px-2 py-0.5 rounded-full">
                            {activeSection.matches.length} trận
                          </span>

                          {pickerOpen && (
                            <>
                              {/* backdrop */}
                              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                              {/* dropdown */}
                              <div className="absolute top-full left-0 mt-2 z-50 w-64 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/98 backdrop-blur shadow-2xl shadow-black p-1.5">
                                {pickerSections.map((s) => {
                                  const isActive = s.key === activeSection.key
                                  return (
                                    <button
                                      key={s.key}
                                      ref={isActive ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                                      type="button"
                                      onClick={() => selectSection(s.key)}
                                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                                        isActive ? 'bg-orange-500/15 text-orange-400' : 'text-zinc-300 hover:bg-white/6'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        {s.isToday && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                                        <span className="truncate">{s.isToday ? `HÔM NAY · ${s.key}` : s.key}</span>
                                      </span>
                                      <span className="shrink-0 text-[11px] font-bold text-zinc-500">{s.matches.length}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Matches of the active section */}
                        <div className="space-y-2.5">
                          {activeSection.matches.map((m) => (
                            <MatchCard key={m.id} match={m} onClick={() => setOpenFixture(m)} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-zinc-600">Chưa có trận nào</div>
                    )
                  ) : (
                    /* Knockout rounds: flat list */
                    <div className="space-y-2.5">
                      {activeMatches.map((m) => (
                        <MatchCard key={m.id} match={m} onClick={() => setOpenFixture(m)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Highlights tab */}
      {subTab === 'highlights' && (
        matchesLoading ? (
          <div className="flex justify-center py-20"><div className="spinner" /></div>
        ) : (
          <HighlightsTab matches={matches} season={season} />
        )
      )}

      {/* Standings tab */}
      {subTab === 'standings' && (
        <>
          {standingsLoading ? (
            <div className="flex justify-center py-20"><div className="spinner" /></div>
          ) : (
            <StandingsTable standings={standings} teamFilter={teamFilter} />
          )}
        </>
      )}

      {/* Scorers tab */}
      {subTab === 'scorers' && <ScorersTable season={season} />}

      {/* Teams tab */}
      {subTab === 'teams' && <TeamsGrid teamFilter={teamFilter} />}

      {/* Fixture detail modal */}
      {openFixture && (
        <FixtureDetail
          match={openFixture}
          onClose={() => setOpenFixture(null)}
        />
      )}
    </div>
  )
}
