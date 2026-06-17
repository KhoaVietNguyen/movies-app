'use client'
import { useQuery } from '@tanstack/react-query'
import { getGenres } from '@/lib/tmdb'
import GenrePicker from './GenrePicker'
import YearPicker from './YearPicker'
import CountryPicker from './CountryPicker'
import { SearchIcon } from './icons'
import type { AppMode } from '@/lib/types'

const MODES: { key: AppMode; icon: string; label: string }[] = [
  { key: 'movie', icon: '🎬', label: 'Phim' },
  { key: 'anime', icon: '✨', label: 'Anime' },
  { key: 'wc',    icon: '🏆', label: 'WC' },
]

interface Props {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  selectedGenre: number | null
  selectedYear: number | null
  selectedCountry: string | null
  onGenreChange: (id: number | null) => void
  onYearChange: (year: number | null) => void
  onCountryChange: (code: string | null) => void
  onSearchClick: () => void
  isAnime?: boolean
  isWatchlist?: boolean
}

export default function Header({
  mode, onModeChange,
  selectedGenre, selectedYear, selectedCountry,
  onGenreChange, onYearChange, onCountryChange,
  onSearchClick, isAnime = false, isWatchlist = false,
}: Props) {
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: Infinity,
  })

  const isWC = mode === 'wc'

  return (
    <header className="glass sticky top-0 z-40">
      <div className="max-w-350 mx-auto px-3 sm:px-6 lg:px-10 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">

        {/* Logo — hidden on mobile to save space */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0 mr-1 sm:mr-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/90 flex items-center justify-center shadow-lg shadow-orange-500/30 text-base sm:text-lg">
            {isWatchlist ? '❤️' : isAnime ? '✨' : isWC ? '🏆' : '🎬'}
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-black text-base tracking-tight leading-none">
              {isWatchlist ? 'YÊU THÍCH' : isAnime ? 'ANIME' : isWC ? 'WORLD CUP' : 'PHIM HAY'}
            </p>
            <p className="text-zinc-600 text-[9px] tracking-widest uppercase mt-0.5">
              {isWatchlist ? 'Danh sách của bạn' : isAnime ? 'Powered by MyAnimeList' : isWC ? 'FIFA 2026' : 'Powered by TMDB'}
            </p>
          </div>
        </div>

        {/* Mode switcher — luôn visible, nằm trong header */}
        <div className="flex gap-0.5 rounded-xl p-1 bg-white/5 border border-white/8 shrink-0">
          {MODES.map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onModeChange(key)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-all cursor-pointer ${
                mode === key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/6'
              }`}
            >
              <span className="leading-none text-sm">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Filters — movie mode only */}
        {!isAnime && !isWatchlist && !isWC && (
          <>
            <GenrePicker genres={genres} selectedGenre={selectedGenre} onGenreChange={onGenreChange} />
            <YearPicker selectedYear={selectedYear} onYearChange={onYearChange} />
            <CountryPicker selectedCountry={selectedCountry} onCountryChange={onCountryChange} />
          </>
        )}

        <div className="flex-1" />

        {/* Search — hidden on WC mode */}
        {!isWC && (
          <button
            type="button"
            onClick={onSearchClick}
            className="flex items-center gap-2 bg-white/6 border border-white/8 hover:border-white/18 hover:bg-white/9 rounded-xl pl-3 pr-2 sm:pr-3 py-2 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer group"
          >
            <SearchIcon className="w-4 h-4 shrink-0 group-hover:text-orange-400 transition-colors" />
            <span className="hidden sm:inline text-xs sm:text-sm whitespace-nowrap">
              {isAnime ? 'Tìm kiếm anime...' : 'Tìm kiếm phim...'}
            </span>
            <kbd className="hidden md:flex items-center text-[10px] text-zinc-700 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-md ml-1">
              ⌘K
            </kbd>
          </button>
        )}
      </div>
    </header>
  )
}
