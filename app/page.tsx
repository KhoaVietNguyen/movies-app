'use client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getMovies, discoverMovies } from '@/lib/tmdb'
import { getAnime, getAnimeByFilter } from '@/lib/jikan'
import type { MovieTab, AnimeTab, AppMode } from '@/lib/types'
import { useWatchlist } from '@/lib/context/WatchlistContext'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import MovieCard from '@/components/MovieCard'
import SearchOverlay from '@/components/SearchOverlay'
import WCPage from '@/components/wc/WCPage'

function validMode(m: string | null): AppMode {
  if (m === 'anime' || m === 'wc') return m
  return 'movie'
}

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mode, setMode] = useState<AppMode>(() => validMode(searchParams.get('mode')))
  const [tab, setTab] = useState<MovieTab>(() => {
    const m = validMode(searchParams.get('mode'))
    return m === 'anime' ? 'anime_popular' : 'now_playing'
  })
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { watchlist } = useWatchlist()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const isWCMode = mode === 'wc'
  const isWatchlist = tab === 'watchlist'
  const isAnime = tab.startsWith('anime_')
  const useAnimeFilter = isAnime && (selectedYear !== null || selectedGenre !== null)
  const useDiscover = !isAnime && !isWatchlist && !isWCMode && (selectedGenre !== null || selectedYear !== null || selectedCountry !== null)

  const queryKey = useAnimeFilter
    ? ['anime', 'filter', selectedGenre, selectedYear]
    : isAnime
      ? ['anime', tab]
      : useDiscover
        ? ['discover', selectedGenre, selectedYear, selectedCountry]
        : ['movies', tab]

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      useAnimeFilter
        ? getAnimeByFilter({ genreId: selectedGenre, year: selectedYear }, pageParam)
        : isAnime
          ? getAnime(tab as AnimeTab, pageParam)
          : useDiscover
            ? discoverMovies({ genreId: selectedGenre, year: selectedYear, country: selectedCountry }, pageParam)
            : getMovies(tab, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !isWatchlist && !isWCMode,
  })

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const movies = isWatchlist ? watchlist : (data?.pages.flatMap((p) => p.results) ?? [])

  const handleTabChange = useCallback((newTab: MovieTab) => {
    setTab(newTab)
    setSelectedGenre(null)
    setSelectedYear(null)
    setSelectedCountry(null)
  }, [])

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode)
    setSelectedGenre(null)
    setSelectedYear(null)
    setSelectedCountry(null)
    if (newMode === 'movie') setTab('now_playing')
    else if (newMode === 'anime') setTab('anime_popular')
    // Sync mode to URL so back-navigation restores the correct mode
    const params = new URLSearchParams()
    if (newMode !== 'movie') params.set('mode', newMode)
    router.replace(params.size ? `/?${params}` : '/', { scroll: false })
  }, [router])

  return (
    <main className="min-h-screen">
      <Sidebar
        tab={tab}
        mode={mode}
        selectedGenre={selectedGenre}
        onTabChange={handleTabChange}
        onGenreChange={setSelectedGenre}
      />

      <div className="md:pl-20 pb-28 md:pb-0">
        <Header
          mode={mode}
          onModeChange={handleModeChange}
          selectedGenre={selectedGenre}
          selectedYear={selectedYear}
          selectedCountry={selectedCountry}
          onGenreChange={setSelectedGenre}
          onYearChange={setSelectedYear}
          onCountryChange={setSelectedCountry}
          onSearchClick={() => setSearchOpen(true)}
          isAnime={isAnime}
          isWatchlist={isWatchlist}
        />

        {isWCMode && <WCPage />}

        {!isWCMode && <>
          {!isWatchlist && isFetching && !isFetchingNextPage && (
            <div className="flex justify-center py-32">
              <div className="spinner" />
            </div>
          )}

          {isWatchlist && watchlist.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
              <span className="text-6xl">♡</span>
              <p className="text-zinc-300 text-lg font-bold">Chưa có phim nào</p>
              <p className="text-zinc-600 text-sm">Nhấn ♡ trên card để lưu phim yêu thích</p>
            </div>
          )}

          {!isWatchlist && !isFetching && movies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
              <span className="text-6xl">🎬</span>
              <p className="text-zinc-300 text-lg font-bold">Không tìm thấy phim nào</p>
              <p className="text-zinc-600 text-sm">Thử điều chỉnh bộ lọc</p>
            </div>
          )}

          {movies.length > 0 && (
            <div className="max-w-350 mx-auto px-3 sm:px-6 lg:px-10 py-5 sm:py-6">
              <div className="movie-grid grid gap-3 sm:gap-5 justify-center">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} type={isAnime ? 'anime' : 'movie'} />
                ))}
              </div>

              {!isWatchlist && (
                <div ref={sentinelRef} className="flex justify-center py-10">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2.5 text-zinc-500 text-sm">
                      <div className="spinner-sm" /> Đang tải thêm...
                    </div>
                  )}
                  {!hasNextPage && !isFetching && (
                    <p className="text-zinc-700 text-sm">Bạn đã xem hết rồi 🎬</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>}
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} mode={isAnime ? 'anime' : 'movie'} />}
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d10]" />}>
      <HomeContent />
    </Suspense>
  )
}
