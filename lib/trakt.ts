import type { TraktInfo } from './types'

const BASE = 'https://api.trakt.tv'
const CLIENT_ID = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID!

const headers = {
  'Content-Type': 'application/json',
  'trakt-api-version': '2',
  'trakt-api-key': CLIENT_ID,
}

export async function getTraktInfo(tmdbId: number): Promise<TraktInfo | null> {
  try {
    const searchRes = await fetch(`${BASE}/search/tmdb/${tmdbId}?type=movie`, { headers })
    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const movie = searchData?.[0]?.movie
    if (!movie) return null

    const slug = movie.ids.slug

    const [detailRes, statsRes] = await Promise.all([
      fetch(`${BASE}/movies/${slug}?extended=full`, { headers }),
      fetch(`${BASE}/movies/${slug}/stats`, { headers }),
    ])

    const detail = detailRes.ok ? await detailRes.json() : {}
    const stats = statsRes.ok ? await statsRes.json() : {}

    return {
      rating: detail.rating ?? null,
      votes: detail.votes ?? null,
      runtime: detail.runtime ?? null,
      certification: detail.certification ?? null,
      watchers: stats.watchers ?? null,
    }
  } catch {
    return null
  }
}
