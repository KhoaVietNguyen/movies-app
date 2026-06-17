'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Movie, TraktInfo, StreamingSource } from '@/lib/types'
import { IMG_W200, IMG_W500, IMG_ORIGINAL, IMG_W92, getMovieDetails } from '@/lib/tmdb'
import { getAnimeDetails } from '@/lib/jikan'
import { useWatchlist } from '@/lib/context/WatchlistContext'
import { getTraktInfo } from '@/lib/trakt'

function imgUrl(path: string | null, prefix: string) {
  if (!path) return null
  return path.startsWith('http') ? path : prefix + path
}

function formatRuntime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatWatchers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}


async function fetchStreaming(tmdbId: number, title: string): Promise<StreamingSource[]> {
  const res = await fetch(`/api/watchmode/${tmdbId}?title=${encodeURIComponent(title)}`)
  if (!res.ok) return []
  return res.json()
}

const TYPE_LABEL: Record<string, string> = {
  sub: 'Subscription',
  free: 'Miễn phí',
  rent: 'Thuê',
  buy: 'Mua',
}
const TYPE_ORDER = ['free', 'sub', 'rent', 'buy']

interface Props {
  movie: Movie
  onClose: () => void
  zIndex?: string
  type?: 'movie' | 'anime'
}

export default function MovieDetailDialog({ movie, onClose, zIndex = 'z-[80]', type = 'movie' }: Props) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [selectedSimilar, setSelectedSimilar] = useState<typeof movie | null>(null)
  const { isInList, toggle } = useWatchlist()
  const saved = isInList(movie.id)

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: type === 'anime' ? ['anime-details', movie.id] : ['movie-details', movie.id],
    queryFn: () => type === 'anime' ? getAnimeDetails(movie.id) : getMovieDetails(movie.id),
    staleTime: 5 * 60 * 1000,
  })

  const { data: trakt, isLoading: traktLoading } = useQuery({
    queryKey: ['trakt', movie.id],
    queryFn: () => getTraktInfo(movie.id),
    staleTime: 60 * 60 * 1000,
    enabled: type === 'movie',
  })

  const { data: streaming = [], isLoading: streamingLoading } = useQuery({
    queryKey: ['watchmode', movie.id],
    queryFn: () => fetchStreaming(movie.id, movie.originalTitle || movie.title),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: type === 'movie',
  })

  const posterLg = imgUrl(movie.posterPath, IMG_W500)
  const backdrop = imgUrl(movie.backdropPath, IMG_ORIGINAL)
  const year = movie.releaseDate ? dayjs(movie.releaseDate).format('YYYY') : ''
  const fullDate = movie.releaseDate ? dayjs(movie.releaseDate).format('DD/MM/YYYY') : '—'

  const trailer =
    details?.videos.find((v) => v.type === 'Trailer' && v.official) ??
    details?.videos.find((v) => v.type === 'Trailer') ??
    details?.videos[0]

  return (
    <>
      <div
        className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center sm:p-4 bg-black/85 [animation-duration:0.2s] animate-fade-up`}
        onClick={onClose}
      >
        <div
          className="modal-surface relative w-full sm:max-w-4xl h-[92dvh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-black/80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 z-20" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm transition-all cursor-pointer"
          >
            ✕
          </button>

          {backdrop ? (
            <div className="relative h-48 sm:h-56 shrink-0 overflow-hidden">
              <img src={backdrop} alt="" className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d10] via-[#0d0d10]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d10]/30 to-transparent" />
              <div className="hidden sm:block absolute bottom-4 left-[186px] right-14 text-white">
                <h2 className="text-xl font-black leading-tight line-clamp-2">
                  {movie.title}
                  {year && <span className="text-zinc-500 font-normal text-base ml-2">({year})</span>}
                </h2>
              </div>
            </div>
          ) : (
            <div className="h-10 sm:h-16 shrink-0" />
          )}

          <div className="overflow-y-auto flex-1 no-scrollbar">
            <div className="flex gap-4 sm:gap-5 px-4 sm:px-5 pt-0 pb-4">
              <div className={`shrink-0 ${backdrop ? '-mt-16 sm:-mt-20' : 'mt-3'} relative z-10`}>
                {posterLg ? (
                  <img src={posterLg} alt={movie.title} className="modal-poster w-[100px] sm:w-[136px] rounded-xl shadow-2xl" />
                ) : (
                  <div className="w-[100px] sm:w-[136px] h-[150px] sm:h-[200px] rounded-xl bg-zinc-800 flex items-center justify-center text-3xl">🎬</div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-3 text-white">
                <h2 className={`text-base sm:text-xl font-black mb-1.5 leading-tight ${backdrop ? 'sm:hidden' : ''}`}>
                  {movie.title}
                  {year && <span className="text-zinc-500 font-normal text-sm sm:text-base ml-2">({year})</span>}
                </h2>

                {/* Meta row: TMDB + date + language + certification + runtime */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-amber-400 font-bold text-sm">★ {movie.voteAverage.toFixed(1)}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-zinc-500 text-xs">{movie.voteCount.toLocaleString()} đánh giá</span>
                  <span className="hidden sm:inline text-zinc-700">·</span>
                  <span className="hidden sm:inline text-zinc-500 text-xs">{fullDate}</span>
                  {movie.originalLanguage && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-600 text-[10px] uppercase font-bold bg-zinc-800 px-1.5 py-0.5 rounded">
                        {movie.originalLanguage}
                      </span>
                    </>
                  )}
                  {trakt?.certification && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-400 text-[10px] font-bold border border-zinc-600 px-1.5 py-0.5 rounded">
                        {trakt.certification}
                      </span>
                    </>
                  )}
                  {trakt?.runtime && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-500 text-xs">{formatRuntime(trakt.runtime)}</span>
                    </>
                  )}
                </div>

                {/* Trakt rating row */}
                {type === 'movie' && (
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    {traktLoading ? (
                      <div className="flex items-center gap-1.5 text-zinc-700 text-xs">
                        <div className="spinner-sm scale-75" /> Trakt...
                      </div>
                    ) : trakt?.rating ? (
                      <>
                        <div className="flex items-center gap-1.5 bg-[#ed1c24]/10 border border-[#ed1c24]/25 rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] font-black text-[#ed1c24] uppercase tracking-wider">Trakt</span>
                          <span className="text-white font-bold text-sm">{Math.round(trakt.rating * 10)}%</span>
                        </div>
                        {trakt.watchers && (
                          <span className="text-zinc-600 text-xs">
                            👥 {formatWatchers(trakt.watchers)} đã xem
                          </span>
                        )}
                      </>
                    ) : null}
                  </div>
                )}

                {(detailsLoading) && !trailer && (
                  <div className="flex items-center gap-2 text-zinc-600 text-sm mb-3">
                    <div className="spinner-sm" /> Đang tải...
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {trailer && (
                    <button
                      type="button"
                      onClick={() => setTrailerKey(trailer.key)}
                      className="flex items-center gap-2 bg-white text-zinc-900 font-bold px-4 sm:px-5 py-2 rounded-xl text-sm hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer shadow-lg"
                    >
                      ▶ Xem Trailer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggle(movie)}
                    className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-all cursor-pointer border ${
                      saved
                        ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/20'
                        : 'bg-white/6 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                    }`}
                  >
                    {saved ? '♥ Đã lưu' : '♡ Lưu phim'}
                  </button>
                </div>

                {movie.overview && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">Nội dung</p>
                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{movie.overview}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="sm:hidden px-4 pb-3 text-zinc-600 text-xs">Ngày phát hành: {fullDate}</div>

            {details?.cast && details.cast.length > 0 && (
              <div className="section-divider px-4 sm:px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">
                  {type === 'anime' ? 'Nhân Vật' : 'Diễn Viên'}
                </p>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 no-scrollbar">
                  {details.cast.map((member) => (
                    <div key={member.id} className="shrink-0 text-center w-14 sm:w-[60px]">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-zinc-800 mx-auto mb-1.5 ring-2 ring-white/[0.06]">
                        {member.profilePath ? (
                          <img src={imgUrl(member.profilePath, IMG_W92)!} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg">👤</div>
                        )}
                      </div>
                      <p className="text-zinc-300 text-[11px] font-semibold leading-tight line-clamp-2">{member.name}</p>
                      <p className="text-zinc-600 text-[10px] line-clamp-1 mt-0.5">{member.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Xem ở đâu — Watchmode */}
            {type === 'movie' && (streamingLoading || streaming.length > 0) && (
              <div className="section-divider px-4 sm:px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">📺 Xem Ở Đâu</p>
                {streamingLoading ? (
                  <div className="flex items-center gap-2 text-zinc-700 text-xs">
                    <div className="spinner-sm scale-75" /> Đang tải...
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {TYPE_ORDER.filter((t) => streaming.some((s) => s.type === t)).map((stype) => {
                      const sources = streaming.filter((s) => s.type === stype)
                      return (
                        <div key={stype} className="flex items-start gap-3">
                          <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider w-20 shrink-0 pt-1">
                            {TYPE_LABEL[stype] ?? stype}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {sources.map((s) => (
                              <a
                                key={s.name + s.type}
                                href={s.webUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 bg-white/6 hover:bg-white/10 border border-white/8 hover:border-white/18 text-zinc-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                {s.name}
                                {s.price && <span className="text-zinc-500 font-normal">{s.price}</span>}
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {details?.similar && details.similar.length > 0 && (
              <div className="section-divider px-4 sm:px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">
                  {type === 'anime' ? 'Anime Tương Tự' : 'Phim Tương Tự'}
                </p>
                <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {details.similar.map((m) => {
                    const inner = (
                      <>
                        <div className="h-[120px] sm:h-36 bg-zinc-800 rounded-lg overflow-hidden mb-1.5">
                          {m.posterPath ? (
                            <img src={imgUrl(m.posterPath, IMG_W200)!} alt={m.title} className="w-full h-full object-cover group-hover/sim:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xl">🎬</div>
                          )}
                        </div>
                        <p className="text-zinc-400 group-hover/sim:text-zinc-200 text-[11px] line-clamp-2 leading-tight transition-colors">{m.title}</p>
                        <p className="text-amber-500 text-[10px] mt-0.5">★ {m.voteAverage.toFixed(1)}</p>
                      </>
                    )
                    return type === 'movie' ? (
                      <Link key={m.id} href={`/movie/${m.id}`} onClick={onClose} className="shrink-0 w-20 sm:w-24 group/sim block">
                        {inner}
                      </Link>
                    ) : (
                      <button key={m.id} type="button" onClick={() => setSelectedSimilar(m)} className="shrink-0 w-20 sm:w-24 group/sim text-left cursor-pointer">
                        {inner}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="h-4 sm:h-2" />
          </div>
        </div>
      </div>

      {selectedSimilar && (
        <MovieDetailDialog
          movie={selectedSimilar}
          onClose={() => setSelectedSimilar(null)}
          zIndex="z-[85]"
          type={type}
        />
      )}

      {trailerKey && (
        <div
          className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/96 [animation-duration:0.2s] animate-fade-up`}
          onClick={() => setTrailerKey(null)}
        >
          <div className="relative w-full max-w-5xl px-3 sm:px-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setTrailerKey(null)}
              className="absolute -top-10 right-3 sm:right-4 flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer"
            >
              ✕ Đóng
            </button>
            <div className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title={`${movie.title} trailer`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
