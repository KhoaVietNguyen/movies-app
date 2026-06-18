import { NextResponse } from 'next/server'
import { fetchWorldCupHighlights, findHighlight } from '@/lib/wc-highlights'

const SPORTSDB = 'https://www.thesportsdb.com/api/v1/json/3'

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function extractDailymotionId(url: string): string | null {
  const m = url.match(/dailymotion\.com\/(?:video\/|embed\/video\/)([a-zA-Z0-9]+)/)
  return m ? m[1] : null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const home = searchParams.get('home') ?? ''
  const away = searchParams.get('away') ?? ''
  const year = searchParams.get('year') ?? '2026'
  const afId = searchParams.get('afId') ?? ''

  if (!home || !away) return NextResponse.json(null)

  // ── 0. ScoreBat feed (own player, VN-accessible, good quality) ──
  try {
    const items = await fetchWorldCupHighlights()
    const hit = findHighlight(items, home, away)
    if (hit?.embedUrl) {
      return NextResponse.json({
        videoId: '',
        embedUrl: hit.embedUrl,
        title: hit.title,
        thumbnail: hit.thumbnail,
        source: 'scorebat',
      })
    }
  } catch { /* continue */ }

  // ── 1. Dailymotion search (VN-accessible, fan uploads not geo-blocked) ──
  try {
    const q = `${home} vs ${away} highlight ${year}`
    const res = await fetch(
      `https://api.dailymotion.com/videos?search=${encodeURIComponent(q)}&fields=id,title,thumbnail_url&limit=5&sort=relevance&longer_than=60`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } },
    )
    if (res.ok) {
      const data = await res.json()
      const videos: any[] = data?.list ?? []
      // Prefer videos with "highlight" in title
      const best = videos.find((v) =>
        v.title?.toLowerCase().includes('highlight') ||
        v.title?.toLowerCase().includes('goal') ||
        v.title?.toLowerCase().includes('goal'),
      ) ?? videos[0]
      if (best?.id) {
        return NextResponse.json({
          videoId: best.id,
          title: best.title,
          thumbnail: best.thumbnail_url,
          source: 'dailymotion',
        })
      }
    }
  } catch { /* continue */ }

  // ── 2. TheSportsDB — may return Dailymotion or YouTube ──
  try {
    const query = `${home} vs ${away}`
    const res = await fetch(
      `${SPORTSDB}/searchevents.php?e=${encodeURIComponent(query)}&s=${year}`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } },
    )
    if (res.ok) {
      const data = await res.json()
      const events: any[] = data?.event ?? []

      let match = afId
        ? events.find((e) => String(e.idAPIfootball) === afId)
        : null

      if (!match) {
        match = events.find((e) => {
          const ht = (e.strHomeTeam ?? '').toLowerCase()
          const at = (e.strAwayTeam ?? '').toLowerCase()
          return (
            ht.includes(home.toLowerCase().slice(0, 4)) ||
            at.includes(away.toLowerCase().slice(0, 4))
          )
        })
      }

      if (match?.strVideo) {
        const dmId = extractDailymotionId(match.strVideo)
        if (dmId) return NextResponse.json({ videoId: dmId, source: 'dailymotion' })
        const ytId = extractYouTubeId(match.strVideo)
        if (ytId) return NextResponse.json({ videoId: ytId, source: 'youtube' })
      }
    }
  } catch { /* continue */ }

  // ── 3. YouTube fallback (may be geo-blocked but user can try with VPN) ──
  try {
    const INVIDIOUS = [
      'https://iv.datura.network',
      'https://invidious.nerdvpn.de',
      'https://invidious.privacyredirect.com',
    ]
    const q = `${home} vs ${away} highlights FIFA World Cup ${year}`
    for (const base of INVIDIOUS) {
      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&fields=videoId,title&page=1`,
        { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } },
      )
      if (!res.ok) continue
      const data = await res.json()
      const first = Array.isArray(data) ? data[0] : null
      if (first?.videoId) return NextResponse.json({ videoId: first.videoId, source: 'youtube' })
    }
  } catch { /* continue */ }

  return NextResponse.json(null)
}
