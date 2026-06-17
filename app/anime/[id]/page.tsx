'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getAnimeById, getAnimeDetails } from '@/lib/jikan'
import { useWatchlist } from '@/lib/context/WatchlistContext'
import { IMG_W200 } from '@/lib/tmdb'

function imgUrl(path: string | null) {
  if (!path) return null
  return path.startsWith('http') ? path : IMG_W200 + path
}

export default function AnimePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const animeId = Number(id)
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { isInList, toggle } = useWatchlist()

  const { data: anime, isLoading } = useQuery({
    queryKey: ['anime', animeId],
    queryFn: () => getAnimeById(animeId),
    staleTime: 5 * 60 * 1000,
  })

  const { data: details } = useQuery({
    queryKey: ['anime-details', animeId],
    queryFn: () => getAnimeDetails(animeId),
    staleTime: 5 * 60 * 1000,
    enabled: !!anime,
  })

  const images = details?.images ?? []
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const prevImage = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), [])
  const nextImage = useCallback(() => setLightboxIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i)), [images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage()
      else if (e.key === 'ArrowRight') nextImage()
      else if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, prevImage, nextImage, closeLightbox])

  const saved = anime ? isInList(anime.id) : false
  const trailer = details?.videos?.[0] ?? null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d10] flex items-center justify-center">
        <div className="spinner-sm scale-150" />
      </div>
    )
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0d0d10] flex flex-col items-center justify-center gap-4 text-zinc-500">
        <p>Không tìm thấy anime.</p>
        <button type="button" onClick={() => router.back()} className="text-orange-400 hover:text-orange-300 text-sm cursor-pointer">← Quay lại</button>
      </div>
    )
  }

  const poster = anime.posterPath
  const year = anime.releaseDate ? dayjs(anime.releaseDate).format('YYYY') : ''
  const fullDate = anime.releaseDate ? dayjs(anime.releaseDate).format('DD/MM/YYYY') : '—'

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

      {/* Hero */}
      {trailer || poster ? (
        <div className="relative h-[56vh] sm:h-[70vh] overflow-hidden">
          {/* Blurred background layer */}
          <img
            src={trailer ? `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg` : poster!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center scale-110 blur-xl"
            aria-hidden
          />
          {/* For poster (portrait): show centered on top of blur */}
          {!trailer && (
            <img
              src={poster!}
              alt=""
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 h-full w-auto min-w-[40%] object-cover"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#0d0d10] via-[#0d0d10]/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-[#0d0d10]/60 to-transparent" />
        </div>
      ) : (
        <div className="h-28 sm:h-40 bg-linear-to-b from-zinc-900 to-[#0d0d10]" />
      )}

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className={`flex gap-5 sm:gap-8 ${trailer || poster ? '-mt-24 sm:-mt-36' : '-mt-4'} relative z-10`}>
          {/* Poster */}
          <div className="shrink-0">
            {poster ? (
              <img src={poster} alt={anime.title} className="w-30 sm:w-50 rounded-xl shadow-2xl ring-1 ring-white/10" />
            ) : (
              <div className="w-30 sm:w-50 h-45 sm:h-75 rounded-xl bg-zinc-800 flex items-center justify-center text-4xl">✨</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-24 sm:pt-0 sm:self-end pb-2">
            <h1 className="text-xl sm:text-3xl font-black leading-tight mb-1">
              {anime.title}
              {year && <span className="text-zinc-500 font-normal text-base sm:text-xl ml-2">({year})</span>}
            </h1>
            {anime.originalTitle && anime.originalTitle !== anime.title && (
              <p className="text-zinc-500 text-sm mb-2">{anime.originalTitle}</p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap mb-4 text-sm">
              <span className="text-amber-400 font-bold">★ {anime.voteAverage.toFixed(1)}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-xs">{anime.voteCount.toLocaleString()} đánh giá</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-xs">{fullDate}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-600 text-[10px] uppercase font-bold bg-zinc-800 px-1.5 py-0.5 rounded">JA</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {trailer && (
                <button
                  type="button"
                  onClick={() => setActiveTrailer(trailer.key)}
                  className="flex items-center gap-2 bg-white text-zinc-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                  ▶ Xem Trailer
                </button>
              )}
              <button
                type="button"
                onClick={() => toggle(anime)}
                className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm active:scale-95 transition-all cursor-pointer border ${
                  saved
                    ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/20'
                    : 'bg-white/6 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                }`}
              >
                {saved ? '♥ Đã lưu' : '♡ Lưu'}
              </button>
            </div>
          </div>
        </div>

        {/* Overview */}
        {anime.overview && (
          <div className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Nội dung</p>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">{anime.overview}</p>
          </div>
        )}

        {/* Screenshots */}
        {images.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Ảnh Cảnh Phim</p>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Xem ảnh ${i + 1}`}
                  className="shrink-0 rounded-xl overflow-hidden bg-zinc-800 cursor-pointer hover:ring-2 hover:ring-orange-400/50 transition-all active:scale-95"
                >
                  <img src={url} alt="" className="h-28 sm:h-36 w-auto object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Characters */}
        {details?.cast && details.cast.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Nhân Vật</p>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {details.cast.map((c) => (
                <div key={c.id} className="shrink-0 text-center w-16">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 mx-auto mb-2 ring-2 ring-white/6">
                    {c.profilePath ? (
                      <img src={c.profilePath} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg">👤</div>
                    )}
                  </div>
                  <p className="text-zinc-300 text-[11px] font-semibold leading-tight line-clamp-2">{c.name}</p>
                  <p className="text-zinc-600 text-[10px] line-clamp-1 mt-0.5">{c.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar anime */}
        {details?.similar && details.similar.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Anime Tương Tự</p>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3">
              {details.similar.map((m) => (
                <Link key={m.id} href={`/anime/${m.id}`} className="group/sim block">
                  <div className="aspect-2/3 bg-zinc-800 rounded-lg overflow-hidden mb-1.5">
                    {m.posterPath ? (
                      <img
                        src={m.posterPath.startsWith('http') ? m.posterPath : IMG_W200 + m.posterPath}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover/sim:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xl">✨</div>
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

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/96"
          onClick={closeLightbox}
        >
          <div className="relative flex items-center justify-center w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
            {/* Prev */}
            <button
              type="button"
              onClick={prevImage}
              disabled={lightboxIndex === 0}
              aria-label="Ảnh trước"
              className="absolute left-0 sm:-left-12 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <img
              src={images[lightboxIndex]}
              alt=""
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />

            {/* Next */}
            <button
              type="button"
              onClick={nextImage}
              disabled={lightboxIndex === images.length - 1}
              aria-label="Ảnh tiếp theo"
              className="absolute right-0 sm:-right-12 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Counter + close */}
          <div className="flex items-center gap-4 mt-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-zinc-400 text-sm tabular-nums">{lightboxIndex + 1} / {images.length}</span>
            <button
              type="button"
              onClick={closeLightbox}
              className="text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer"
            >
              ✕ Đóng
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 mt-4 overflow-x-auto max-w-xl px-4 pb-1 no-scrollbar" onClick={(e) => e.stopPropagation()}>
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden transition-all cursor-pointer ${
                  i === lightboxIndex ? 'ring-2 ring-orange-400 opacity-100' : 'opacity-40 hover:opacity-70'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

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
                title={`${anime.title} trailer`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
