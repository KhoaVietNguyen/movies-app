'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getMovie, getMovieDetails, IMG_W200, IMG_W500, IMG_ORIGINAL, IMG_W92 } from '@/lib/tmdb'
import { getTraktInfo } from '@/lib/trakt'
import { useWatchlist } from '@/lib/context/WatchlistContext'
import type { StreamingSource } from '@/lib/types'

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

export default function MoviePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const movieId = Number(id)
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { isInList, toggle } = useWatchlist()

  const { data: movie, isLoading: movieLoading } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => getMovie(movieId),
    staleTime: 5 * 60 * 1000,
  })

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['movie-details', movieId],
    queryFn: () => getMovieDetails(movieId),
    staleTime: 5 * 60 * 1000,
    enabled: !!movie,
  })

  const tmdbTrailer =
    details?.videos.find((v) => v.type === 'Trailer' && v.official) ??
    details?.videos.find((v) => v.type === 'Trailer')

  const { data: fallbackTrailer } = useQuery({
    queryKey: ['trailer-fallback', movieId],
    queryFn: async () => {
      const q = `${movie!.originalTitle || movie!.title} ${movie!.releaseDate?.slice(0, 4) ?? ''} official trailer`
      const res = await fetch(`/api/trailer?q=${encodeURIComponent(q)}`)
      if (!res.ok) return null
      return res.json() as Promise<{ videoId: string } | null>
    },
    staleTime: 7 * 24 * 60 * 60 * 1000,
    enabled: !!movie && !!details && !tmdbTrailer,
  })

  const { data: trakt, isLoading: traktLoading } = useQuery({
    queryKey: ['trakt', movieId],
    queryFn: () => getTraktInfo(movieId),
    staleTime: 60 * 60 * 1000,
    enabled: !!movie,
  })

  const { data: streaming = [], isLoading: streamingLoading } = useQuery({
    queryKey: ['watchmode', movieId],
    queryFn: () => fetchStreaming(movieId, movie!.originalTitle || movie!.title),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!movie,
  })

  const images = details?.images ?? []

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const prevImage = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), [])
  const nextImage = useCallback(() => setLightboxIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i)), [images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, closeLightbox, prevImage, nextImage])

  const saved = movie ? isInList(movie.id) : false

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d10] flex items-center justify-center">
        <div className="spinner-sm scale-150" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0d0d10] flex flex-col items-center justify-center gap-4 text-zinc-500">
        <p>Không tìm thấy phim.</p>
        <button type="button" onClick={() => router.back()} className="text-orange-400 hover:text-orange-300 text-sm cursor-pointer">← Quay lại</button>
      </div>
    )
  }

  const backdrop = imgUrl(movie.backdropPath, IMG_ORIGINAL)
  const poster = imgUrl(movie.posterPath, IMG_W500)
  const year = movie.releaseDate ? dayjs(movie.releaseDate).format('YYYY') : ''
  const fullDate = movie.releaseDate ? dayjs(movie.releaseDate).format('DD/MM/YYYY') : '—'

  const trailerKey = tmdbTrailer?.key ?? fallbackTrailer?.videoId ?? null

  return (
    <div className="min-h-screen bg-[#0d0d10] text-white">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-zinc-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/10 hover:border-white/20 transition-all cursor-pointer"
        >
          ← Quay lại
        </button>
      </div>

      {/* Backdrop hero */}
      {backdrop && (
        <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
          <img src={backdrop} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-linear-to-t from-[#0d0d10] via-[#0d0d10]/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-[#0d0d10]/60 to-transparent" />
        </div>
      )}

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex gap-5 sm:gap-8 -mt-24 sm:-mt-36 relative z-10">
          {/* Poster */}
          <div className="shrink-0">
            {poster ? (
              <img
                src={poster}
                alt={movie.title}
                className="w-30 sm:w-50 rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            ) : (
              <div className="w-30 sm:w-50 h-45 sm:h-75 rounded-xl bg-zinc-800 flex items-center justify-center text-4xl">🎬</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-24 sm:pt-0 sm:self-end pb-2">
            <h1 className="text-xl sm:text-3xl font-black leading-tight mb-1">
              {movie.title}
              {year && <span className="text-zinc-500 font-normal text-base sm:text-xl ml-2">({year})</span>}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap mb-3 text-sm">
              <span className="text-amber-400 font-bold">★ {movie.voteAverage.toFixed(1)}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-xs">{movie.voteCount.toLocaleString()} đánh giá</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-xs">{fullDate}</span>
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

            {/* Trakt row */}
            <div className="flex items-center gap-3 mb-4">
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
                    <span className="text-zinc-600 text-xs">👥 {formatWatchers(trakt.watchers)} đã xem</span>
                  )}
                </>
              ) : null}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {trailerKey && (
                <button
                  type="button"
                  onClick={() => setActiveTrailer(trailerKey)}
                  className="flex items-center gap-2 bg-white text-zinc-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                  ▶ Xem Trailer
                </button>
              )}
              {detailsLoading && !trailerKey && (
                <div className="flex items-center gap-2 text-zinc-600 text-sm">
                  <div className="spinner-sm" /> Đang tải...
                </div>
              )}
              <button
                type="button"
                onClick={() => toggle(movie)}
                className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm active:scale-95 transition-all cursor-pointer border ${
                  saved
                    ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/20'
                    : 'bg-white/6 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                }`}
              >
                {saved ? '♥ Đã lưu' : '♡ Lưu phim'}
              </button>
            </div>
          </div>
        </div>

        {/* Overview */}
        {movie.overview && (
          <div className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Nội dung</p>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">{movie.overview}</p>
          </div>
        )}

        {/* Images / Screenshots */}
        {images.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Ảnh Cảnh Phim</p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {images.map((path, idx) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  title="Xem ảnh lớn"
                  className="shrink-0 h-28 sm:h-36 aspect-video rounded-lg overflow-hidden bg-zinc-800 cursor-pointer group/img relative"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    alt=""
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {details?.cast && details.cast.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Diễn Viên</p>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {details.cast.map((member) => (
                <div key={member.id} className="shrink-0 text-center w-16">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 mx-auto mb-2 ring-2 ring-white/6">
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

        {/* Xem ở đâu */}
        {(streamingLoading || streaming.length > 0) && (
          <div className="mt-8 pt-6 border-t border-white/6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">📺 Xem Ở Đâu</p>
            {streamingLoading ? (
              <div className="flex items-center gap-2 text-zinc-700 text-xs">
                <div className="spinner-sm scale-75" /> Đang tải...
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {TYPE_ORDER.filter((t) => streaming.some((s) => s.type === t)).map((stype) => {
                  const sources = streaming.filter((s) => s.type === stype)
                  return (
                    <div key={stype} className="flex items-start gap-4">
                      <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider w-24 shrink-0 pt-1.5">
                        {TYPE_LABEL[stype] ?? stype}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((s) => (
                          <a
                            key={s.name + s.type}
                            href={s.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
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

        {/* Similar movies */}
        {details?.similar && details.similar.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Phim Tương Tự</p>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3">
              {details.similar.map((m) => (
                <Link key={m.id} href={`/movie/${m.id}`} className="group/sim block">
                  <div className="aspect-2/3 bg-zinc-800 rounded-lg overflow-hidden mb-1.5">
                    {m.posterPath ? (
                      <img
                        src={imgUrl(m.posterPath, IMG_W200)!}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover/sim:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xl">🎬</div>
                    )}
                  </div>
                  <p className="text-zinc-400 group-hover/sim:text-zinc-200 text-[11px] line-clamp-2 leading-tight transition-colors">{m.title}</p>
                  <p className="text-amber-500 text-[10px] mt-0.5">★ {m.voteAverage.toFixed(1)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trailer modal */}
      {activeTrailer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/96"
          onClick={() => setActiveTrailer(null)}
        >
          <div className="relative w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveTrailer(null)}
              className="absolute -top-10 right-4 flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer"
            >
              ✕ Đóng
            </button>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeTrailer}?autoplay=1`}
                title={`${movie.title} trailer`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightboxIndex !== null && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/96"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all cursor-pointer z-10"
          >
            ✕
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-zinc-400 text-xs font-semibold bg-black/50 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevImage() }}
              aria-label="Ảnh trước" className="absolute left-3 sm:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10 backdrop-blur-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}

          {/* Image */}
          <img
            src={IMG_ORIGINAL + images[lightboxIndex]}
            alt=""
            className="max-w-full max-h-full px-16 sm:px-24 rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {lightboxIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextImage() }}
              aria-label="Ảnh tiếp theo" className="absolute right-3 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10 backdrop-blur-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto no-scrollbar max-w-xs sm:max-w-lg px-3">
            {images.map((path, idx) => (
              <button
                key={path}
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx) }}
                className={`shrink-0 w-12 h-8 rounded overflow-hidden transition-all cursor-pointer ${
                  idx === lightboxIndex ? 'ring-2 ring-orange-500 opacity-100' : 'opacity-40 hover:opacity-70'
                }`}
              >
                <img src={`https://image.tmdb.org/t/p/w200${path}`} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
