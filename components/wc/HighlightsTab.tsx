'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import type { WCMatch } from '@/lib/wc-types'
import { findHighlight, type ScorebatItem } from '@/lib/wc-highlights'

dayjs.locale('vi')

interface HighlightData {
  videoId: string
  source: 'dailymotion' | 'youtube' | 'scorebat'
  embedUrl?: string
  title?: string
  thumbnail?: string
}

async function fetchHighlightFeed(): Promise<ScorebatItem[]> {
  const res = await fetch('/api/wc/highlights-feed')
  if (!res.ok) return []
  return res.json()
}

async function fetchMatchHighlight(match: WCMatch): Promise<HighlightData | null> {
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
  matches: WCMatch[]
  season: string
}

export default function HighlightsTab({ matches }: Props) {
  const [selected, setSelected] = useState<WCMatch | null>(null)

  const { data: feed = [], isLoading: feedLoading } = useQuery({
    queryKey: ['wc-highlights-feed'],
    queryFn: fetchHighlightFeed,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const finished = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'FINISHED')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [matches],
  )

  const feedFor = (m: WCMatch) => findHighlight(feed, m.homeTeam.name, m.awayTeam.name)

  if (finished.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="text-4xl">🎬</span>
        <p className="text-zinc-400 font-semibold">Chưa có trận nào kết thúc</p>
        <p className="text-zinc-600 text-sm">Highlight sẽ xuất hiện sau khi trận đấu kết thúc</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {finished.map((m) => {
          const hit = feedFor(m)
          const thumb = hit?.thumbnail
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m)}
              className="group text-left rounded-2xl overflow-hidden border border-white/8 bg-white/2 hover:border-white/18 hover:bg-white/4 transition-all cursor-pointer"
            >
              {/* Thumbnail / cover */}
              <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={`${m.homeTeam.name} vs ${m.awayTeam.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center gap-4 px-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.homeTeam.logo} alt={m.homeTeam.name} className="w-12 h-12 object-contain" />
                    <span className="text-white font-black text-lg tabular-nums">
                      {m.homeScore}–{m.awayScore}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.awayTeam.logo} alt={m.awayTeam.name} className="w-12 h-12 object-contain" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <span className="text-white text-lg ml-0.5">▶</span>
                  </div>
                </div>
                {hit && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/90 text-white">
                    HD
                  </span>
                )}
              </div>

              {/* Caption */}
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white truncate">
                    {m.homeTeam.name} <span className="text-zinc-500">vs</span> {m.awayTeam.name}
                  </p>
                  <span className="shrink-0 text-xs font-black text-zinc-300 tabular-nums">
                    {m.homeScore}–{m.awayScore}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {m.round}{m.group ? ` · Bảng ${m.group}` : ''} · {dayjs(m.date).format('DD/MM/YYYY')}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {feedLoading && finished.length > 0 && (
        <p className="text-center text-zinc-600 text-xs mt-4">Đang tải thumbnail highlight…</p>
      )}

      {selected && (
        <HighlightModal
          match={selected}
          feedItem={feedFor(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function HighlightModal({
  match,
  feedItem,
  onClose,
}: {
  match: WCMatch
  feedItem: ScorebatItem | null
  onClose: () => void
}) {
  // Only hit the per-match endpoint when the bulk feed has no match.
  const { data, isLoading } = useQuery({
    queryKey: ['wc-highlight', match.id],
    queryFn: () => fetchMatchHighlight(match),
    enabled: !feedItem,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const embedUrl = feedItem?.embedUrl ?? (data?.source !== 'youtube' ? data?.embedUrl : undefined)
  const source = feedItem ? 'scorebat' : data?.source
  const isYouTube = !feedItem && data?.source === 'youtube'
  const isDailymotion = !feedItem && data?.source === 'dailymotion'

  const ytUrl = data?.videoId ? `https://www.youtube.com/watch?v=${data.videoId}` : ''
  const ytThumb = data?.videoId ? `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg` : ''
  const dmEmbed = data?.videoId ? `https://www.dailymotion.com/embed/video/${data.videoId}?autoplay=1&mute=0` : ''

  const iframeSrc = feedItem ? feedItem.embedUrl : isDailymotion ? dmEmbed : embedUrl
  const hasIframe = Boolean(iframeSrc)
  const notFound = !isLoading && !feedItem && !data?.videoId && !embedUrl

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/96" onClick={onClose}>
      <div className="relative w-full max-w-3xl px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-zinc-300 text-sm font-semibold truncate">
              {match.homeTeam.name} {match.homeScore}–{match.awayScore} {match.awayTeam.name} — Highlight
            </p>
            {source && (
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                source === 'scorebat'
                  ? 'bg-orange-500/20 text-orange-400'
                  : source === 'dailymotion'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {source === 'scorebat' ? 'ScoreBat' : source === 'dailymotion' ? 'Dailymotion' : 'YouTube'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer ml-3 shrink-0"
          >
            ✕ Đóng
          </button>
        </div>

        {isLoading ? (
          <div className="aspect-video rounded-2xl bg-white/4 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : hasIframe ? (
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black">
            <iframe
              src={iframeSrc}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              title="Highlight"
            />
          </div>
        ) : isYouTube ? (
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black group/yt"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ytThumb} alt="highlight" className="w-full h-full object-cover group-hover/yt:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/40 group-hover/yt:bg-black/20 transition-colors flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover/yt:scale-110 transition-transform">
                <span className="text-white text-2xl ml-1">▶</span>
              </div>
              <p className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">Xem trên YouTube</p>
            </div>
          </a>
        ) : (
          <div className="aspect-video rounded-2xl bg-white/4 flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-3xl">🔍</span>
            <p className="text-zinc-400 text-sm font-semibold">Không tìm thấy highlight cho trận này</p>
          </div>
        )}

        {notFound ? null : (
          <p className="text-zinc-600 text-[11px] text-center mt-2">
            {source === 'youtube'
              ? 'FIFA chặn embed · Click để xem trên YouTube (có thể cần VPN)'
              : 'Phát trực tiếp trong ứng dụng'}
          </p>
        )}
      </div>
    </div>
  )
}
