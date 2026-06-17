'use client'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import type { Movie } from '@/lib/types'
import { IMG_W200 } from '@/lib/tmdb'
import { useWatchlist } from '@/lib/context/WatchlistContext'

function imgUrl(path: string | null, prefix: string) {
  if (!path) return null
  return path.startsWith('http') ? path : prefix + path
}

export default function MovieCard({ movie, type = 'movie' }: { movie: Movie; type?: 'movie' | 'anime' }) {
  const router = useRouter()
  const { isInList, toggle } = useWatchlist()
  const saved = isInList(movie.id)

  const poster = imgUrl(movie.posterPath, IMG_W200)
  const year = movie.releaseDate ? dayjs(movie.releaseDate).format('YYYY') : ''

  return (
    <>
      <div
        onClick={() => router.push(type === 'anime' ? `/anime/${movie.id}` : `/movie/${movie.id}`)}
        className="group relative w-full aspect-2/3 rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1.5 bg-zinc-900"
      >
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-3xl">🎬</div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-400/20">
          ★ {movie.voteAverage.toFixed(1)}
        </div>

        {/* Heart button — always visible if saved, else shows on hover */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle(movie) }}
          className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            saved
              ? 'bg-red-500/90 text-white opacity-100'
              : 'bg-black/60 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-black/80'
          }`}
        >
          {saved ? '♥' : '♡'}
        </button>

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/95 via-black/60 to-transparent" />
        <div className="card-title absolute bottom-0 left-0 right-0 p-3 transition-transform duration-300 group-hover:translate-y-full">
          <p className="text-white font-semibold text-[13px] leading-tight line-clamp-2">{movie.title}</p>
          <p className="text-zinc-500 text-[11px] mt-1">{year}</p>
        </div>

        <div className="card-hover absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
          <p className="text-white font-semibold text-[13px] leading-tight mb-2">{movie.title}</p>
          <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-5">{movie.overview || 'Chưa có mô tả.'}</p>
          <div className="mt-3 flex items-center gap-1 text-orange-400 text-xs font-bold">
            Xem chi tiết <span>→</span>
          </div>
        </div>
      </div>

    </>
  )
}
