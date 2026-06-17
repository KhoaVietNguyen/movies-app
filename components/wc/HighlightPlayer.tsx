'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { WCMatch } from '@/lib/wc-types'

interface HighlightData {
  videoId: string
  source: 'dailymotion' | 'youtube'
  title?: string
  thumbnail?: string
}

async function fetchHighlight(match: WCMatch): Promise<HighlightData | null> {
  const params = new URLSearchParams({
    home: match.homeTeam.name,
    away: match.awayTeam.name,
    year: new Date(match.date).getFullYear().toString(),
    afId: String(match.id),
  })
  const res = await fetch(`/api/wc/highlight?${params}`)
  if (!res.ok) return null
  return res.json()
}

interface Props {
  match: WCMatch
}

export default function HighlightPlayer({ match }: Props) {
  const [open, setOpen] = useState(false)

  const { data, isLoading, refetch, isFetched } = useQuery({
    queryKey: ['wc-highlight', match.id],
    queryFn: () => fetchHighlight(match),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: false,
  })

  const handleClick = () => {
    if (!isFetched) {
      refetch().then(() => setOpen(true))
    } else if (data?.videoId) {
      setOpen(true)
    }
  }

  if (match.status !== 'FINISHED') return null

  const isDailymotion = data?.source === 'dailymotion'
  const ytUrl = data?.videoId ? `https://www.youtube.com/watch?v=${data.videoId}` : ''
  const ytThumb = data?.videoId ? `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg` : ''
  const dmThumb = data?.thumbnail ?? `https://www.dailymotion.com/thumbnail/video/${data?.videoId}`
  const dmEmbed = data?.videoId ? `https://www.dailymotion.com/embed/video/${data.videoId}?autoplay=1&mute=0` : ''

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-white/6 hover:bg-white/10 border border-white/8 hover:border-white/18 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <><span className="spinner-sm scale-75" /> Đang tìm...</>
        ) : (
          <>▶ Highlight</>
        )}
      </button>

      {isFetched && !data?.videoId && !isLoading && (
        <span className="text-[11px] text-zinc-700">Không tìm thấy highlight</span>
      )}

      {open && data?.videoId && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/96"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-3xl px-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-zinc-300 text-sm font-semibold">
                  {match.homeTeam.name} vs {match.awayTeam.name} — Highlight
                </p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isDailymotion
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {isDailymotion ? 'Dailymotion' : 'YouTube'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer ml-3 shrink-0"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Player */}
            {isDailymotion ? (
              /* Dailymotion embed — không bị chặn ở VN */
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black">
                <iframe
                  src={dmEmbed}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  title="Highlight"
                />
              </div>
            ) : (
              /* YouTube — thumbnail + link vì FIFA chặn embed */
              <a
                href={ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black group/yt"
              >
                <img
                  src={ytThumb}
                  alt="highlight thumbnail"
                  className="w-full h-full object-cover group-hover/yt:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover/yt:bg-black/20 transition-colors flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover/yt:scale-110 transition-transform">
                    <span className="text-white text-2xl ml-1">▶</span>
                  </div>
                  <p className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">Xem trên YouTube</p>
                </div>
              </a>
            )}

            {isDailymotion ? (
              <p className="text-zinc-600 text-[11px] text-center mt-2">
                Dailymotion · Phát trực tiếp trong ứng dụng
              </p>
            ) : (
              <p className="text-zinc-600 text-[11px] text-center mt-2">
                FIFA chặn embed · Click để xem trên YouTube (có thể cần VPN)
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
