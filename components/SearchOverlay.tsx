'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Movie } from '@/lib/types'
import { IMG_W92, searchMovies } from '@/lib/tmdb'
import { searchAnime } from '@/lib/jikan'
import { useDebounce } from '@/lib/useDebounce'
import MovieDetailDialog from './MovieDetailDialog'
import { SearchIcon } from './icons'

interface Props {
  onClose: () => void
  mode?: 'movie' | 'anime'
}

export default function SearchOverlay({ onClose, mode = 'movie' }: Props) {
  const [raw, setRaw] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const [selected, setSelected] = useState<Movie | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const q = useDebounce(raw, 280)

  const { data, isFetching } = useQuery({
    queryKey: ['search-suggest', mode, q],
    queryFn: () => mode === 'anime' ? searchAnime(q, 1) : searchMovies(q, 1),
    enabled: q.trim().length > 1,
    staleTime: 30_000,
  })

  const results = data?.results.slice(0, 7) ?? []

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setHighlighted(0) }, [q])

  const pick = useCallback((movie: Movie) => setSelected(movie), [])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && results[highlighted]) pick(results[highlighted])
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="search-backdrop fixed inset-0 z-[70] flex flex-col items-center pt-[12vh] sm:pt-[18vh] px-4 bg-black/60 [animation-duration:0.18s] animate-fade-up"
        onClick={onClose}
      >
        {/* Search container */}
        <div
          className="w-full max-w-2xl [animation-duration:0.22s] animate-fade-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input box */}
          <div className="search-input-surface flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl shadow-2xl shadow-black/60">
            <SearchIcon className={`w-5 h-5 shrink-0 transition-colors ${raw ? 'text-orange-400' : 'text-zinc-500'}`} />
            <input
              ref={inputRef}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tìm kiếm phim..."
              className="flex-1 bg-transparent text-white text-base sm:text-lg placeholder:text-zinc-600 outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              {isFetching && <div className="spinner-sm" />}
              {raw && (
                <button
                  type="button"
                  onClick={() => setRaw('')}
                  className="text-zinc-600 hover:text-zinc-300 text-sm transition-colors cursor-pointer w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  ✕
                </button>
              )}
              <kbd className="hidden sm:flex items-center text-zinc-700 text-xs bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
                Esc
              </kbd>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-2 search-results-surface rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {results.map((movie, i) => {
                const year = movie.releaseDate ? dayjs(movie.releaseDate).format('YYYY') : '—'
                return (
                  <button
                    type="button"
                    key={movie.id}
                    onClick={() => pick(movie)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`w-full flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer text-left border-b border-white/[0.04] last:border-0 ${
                      i === highlighted ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Poster thumbnail */}
                    <div className="w-9 h-[52px] sm:w-10 sm:h-[58px] rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                      {movie.posterPath ? (
                        <img
                          src={movie.posterPath.startsWith('http') ? movie.posterPath : IMG_W92 + movie.posterPath}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">🎬</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{movie.title}</p>
                      {movie.originalTitle !== movie.title && (
                        <p className="text-zinc-600 text-xs truncate mt-0.5">{movie.originalTitle}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-zinc-500 text-xs">{year}</span>
                        <span className="text-zinc-800">·</span>
                        <span className="text-amber-400 text-xs font-semibold">★ {movie.voteAverage.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <span className={`text-sm shrink-0 transition-colors ${i === highlighted ? 'text-orange-400' : 'text-zinc-800'}`}>
                      →
                    </span>
                  </button>
                )
              })}

              <div className="px-4 py-2 flex items-center gap-3 border-t border-white/[0.04]">
                <span className="text-zinc-700 text-[10px]">
                  <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-[9px]">↑↓</kbd> di chuyển
                </span>
                <span className="text-zinc-700 text-[10px]">
                  <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-[9px]">↵</kbd> mở
                </span>
                <span className="text-zinc-700 text-[10px]">
                  <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-[9px]">Esc</kbd> đóng
                </span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {q.length > 1 && !isFetching && results.length === 0 && (
            <div className="mt-2 search-results-surface rounded-2xl px-4 py-10 text-center">
              <p className="text-zinc-400 font-semibold">Không tìm thấy phim nào</p>
              <p className="text-zinc-700 text-sm mt-1">Thử tìm với từ khóa khác</p>
            </div>
          )}

          {/* Idle hint */}
          {!raw && (
            <p className="text-center text-zinc-700 text-sm mt-6">
              Nhập tên phim để tìm kiếm
            </p>
          )}
        </div>
      </div>

      {/* Movie detail on top of overlay */}
      {selected && (
        <MovieDetailDialog
          movie={selected}
          onClose={() => setSelected(null)}
          zIndex="z-[85]"
          type={mode}
        />
      )}
    </>
  )
}
