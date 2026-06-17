'use client'
import type { MovieTab, AppMode } from '@/lib/types'
import { useWatchlist } from '@/lib/context/WatchlistContext'

interface Props {
  tab: MovieTab
  mode: AppMode
  selectedGenre: number | null
  onTabChange: (tab: MovieTab) => void
  onGenreChange: (id: number | null) => void
}

const MOVIE_TABS = [
  { key: 'now_playing' as MovieTab, icon: '▶',  label: 'Đang Chiếu',   short: 'Chiếu' },
  { key: 'top_rated'   as MovieTab, icon: '⭐', label: 'Đánh Giá Cao', short: 'Top'   },
  { key: 'trending'    as MovieTab, icon: '🔥', label: 'Thịnh Hành',   short: 'Hot'   },
  { key: 'upcoming'    as MovieTab, icon: '🗓', label: 'Sắp Chiếu',    short: 'Sắp'   },
  { key: 'watchlist'   as MovieTab, icon: '❤️', label: 'Yêu Thích',    short: 'Lưu'   },
]

const ANIME_TABS = [
  { key: 'anime_popular' as MovieTab, icon: '✨', label: 'Phổ Biến',     short: 'Hot'   },
  { key: 'anime_top'     as MovieTab, icon: '👑', label: 'Top',           short: 'Top'   },
  { key: 'anime_airing'  as MovieTab, icon: '📡', label: 'Đang Phát Sóng', short: 'Sóng' },
]

export default function Sidebar({ tab, mode, selectedGenre, onTabChange, onGenreChange }: Props) {
  const { count } = useWatchlist()
  const handleTab = (key: MovieTab) => {
    onTabChange(key)
    onGenreChange(null)
  }

  const tabs = mode === 'anime' ? ANIME_TABS : MOVIE_TABS
  if (mode === 'wc') return null

  return (
    <>
      {/* ── Desktop: floating pill sidebar ── */}
      <aside className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-30">
        <nav className="group/nav flex flex-col gap-1 rounded-2xl p-2 w-14 hover:w-48 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden shadow-2xl shadow-black/60 sidebar-surface">
          {tabs.map(({ key, icon, label }) => {
            const active = tab === key && selectedGenre === null
            return (
              <button
                type="button"
                key={key}
                onClick={() => handleTab(key)}
                className={`flex items-center gap-3 pl-2.5 pr-3 py-3 rounded-xl transition-all cursor-pointer ${
                  active
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]'
                }`}
              >
                <span className="shrink-0 text-lg w-7 text-center leading-none">{icon}</span>
                <span className="whitespace-nowrap text-[13px] font-semibold opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 delay-100">
                  {label}
                </span>
                {key === 'watchlist' && count > 0 && (
                  <span className="ml-auto shrink-0 text-[10px] font-black bg-red-500 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 delay-100">
                    {count}
                  </span>
                )}
                {active && key !== 'watchlist' && (
                  <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 delay-100" />
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Mobile: bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bottom-nav-surface pb-safe">
        <div className="flex">
          {tabs.map(({ key, icon, short }) => {
            const active = tab === key && selectedGenre === null
            return (
              <button
                type="button"
                key={key}
                onClick={() => handleTab(key)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors cursor-pointer ${
                  active ? 'text-orange-400' : 'text-zinc-600 active:text-zinc-300'
                }`}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-orange-400" />}
                <span className="text-xl leading-none">{icon}</span>
                <span className="text-[10px] font-semibold">{short}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
