import { NextResponse } from 'next/server'

const TRAKT_BASE = 'https://api.trakt.tv'
const CLIENT_ID = process.env.TRAKT_CLIENT_ID!

const headers = {
  'Content-Type': 'application/json',
  'trakt-api-version': '2',
  'trakt-api-key': CLIENT_ID,
}

export async function GET(_req: Request, { params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params

  const searchRes = await fetch(
    `${TRAKT_BASE}/search/tmdb/${tmdbId}?type=movie`,
    { headers, next: { revalidate: 3600 } },
  )

  if (!searchRes.ok) {
    console.error('[Trakt] search failed', searchRes.status, await searchRes.text())
    return NextResponse.json(null, { status: 200 })
  }

  const searchData = await searchRes.json()
  const movie = searchData?.[0]?.movie
  if (!movie) return NextResponse.json(null, { status: 200 })

  const slug = movie.ids.slug

  const [detailRes, statsRes] = await Promise.all([
    fetch(`${TRAKT_BASE}/movies/${slug}?extended=full`, { headers, next: { revalidate: 3600 } }),
    fetch(`${TRAKT_BASE}/movies/${slug}/stats`, { headers, next: { revalidate: 3600 } }),
  ])

  const detail = detailRes.ok ? await detailRes.json() : {}
  const stats = statsRes.ok ? await statsRes.json() : {}

  return NextResponse.json({
    rating: detail.rating ?? null,
    votes: detail.votes ?? null,
    runtime: detail.runtime ?? null,
    certification: detail.certification ?? null,
    watchers: stats.watchers ?? null,
  })
}
