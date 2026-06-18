import { normalizeTeam } from './wc-teams-vi'

export interface ScorebatItem {
  home: string
  away: string
  date: string        // ISO
  title: string
  thumbnail: string
  embedUrl: string    // iframe src
  competition: string
}

// ScoreBat free feed — server-side fetch with a normal UA (their edge 403s bot crawlers).
const FEED_URL = 'https://www.scorebat.com/video-api/v3/feed/'

function extractIframeSrc(embedHtml: string): string {
  const m = embedHtml?.match(/src=["']([^"']+)["']/)
  return m ? m[1] : ''
}

function looksLikeWorldCup(competition: string): boolean {
  const c = competition.toLowerCase()
  return c.includes('world cup') || c.includes('fifa') || c.includes('coupe du monde')
}

/**
 * Fetch + normalize the ScoreBat highlight feed. Cached aggressively via the Next fetch
 * cache. Returns [] on any failure so callers can fall back gracefully.
 */
export async function fetchScorebatFeed(): Promise<ScorebatItem[]> {
  try {
    const token = process.env.SCOREBAT_TOKEN
    const url = token ? `${FEED_URL}?token=${token}` : FEED_URL
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list: any[] = Array.isArray(data) ? data : (data?.response ?? [])

    return list
      .map((item): ScorebatItem | null => {
        const title: string = item.title ?? ''
        const competition: string =
          typeof item.competition === 'string'
            ? item.competition
            : (item.competition?.name ?? '')
        // title format is usually "Home - Away"
        const [home, away] = title.split(' - ').map((s: string) => s.trim())
        const video = (item.videos ?? [])[0]
        const embedUrl = video?.embed ? extractIframeSrc(video.embed) : ''
        if (!home || !away || !embedUrl) return null
        return {
          home,
          away,
          date: item.date ?? '',
          title,
          thumbnail: item.thumbnail ?? '',
          embedUrl,
          competition,
        }
      })
      .filter((x): x is ScorebatItem => x !== null)
  } catch {
    return []
  }
}

/** World-Cup-only subset of the feed. */
export async function fetchWorldCupHighlights(): Promise<ScorebatItem[]> {
  const all = await fetchScorebatFeed()
  const wc = all.filter((i) => looksLikeWorldCup(i.competition))
  // If the feed has no explicit WC tagging, fall back to everything (better than empty).
  return wc.length > 0 ? wc : all
}

/** Find a feed item for a given fixture by fuzzy team-name match. */
export function findHighlight(
  items: ScorebatItem[],
  home: string,
  away: string,
): ScorebatItem | null {
  const h = normalizeTeam(home)
  const a = normalizeTeam(away)
  return (
    items.find((i) => {
      const ih = normalizeTeam(i.home)
      const ia = normalizeTeam(i.away)
      const direct =
        (ih.includes(h) || h.includes(ih)) && (ia.includes(a) || a.includes(ia))
      const swapped =
        (ih.includes(a) || a.includes(ih)) && (ia.includes(h) || h.includes(ia))
      return direct || swapped
    }) ?? null
  )
}
