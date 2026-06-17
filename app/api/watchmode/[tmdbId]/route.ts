import { NextResponse } from 'next/server'

const BASE = 'https://api.watchmode.com/v1'
const KEY = process.env.WATCHMODE_API_KEY!

export async function GET(req: Request, { params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? ''

  if (!title) return NextResponse.json([], { status: 200 })

  // Step 1: search by title, then match tmdb_id
  const searchRes = await fetch(
    `${BASE}/search/?apiKey=${KEY}&search_field=name&search_value=${encodeURIComponent(title)}&types=movie`,
    { next: { revalidate: 86400 } },
  )
  if (!searchRes.ok) return NextResponse.json([], { status: 200 })

  const searchData = await searchRes.json()
  const match = (searchData?.title_results ?? []).find(
    (r: any) => String(r.tmdb_id) === tmdbId,
  )
  if (!match) return NextResponse.json([], { status: 200 })

  // Step 2: fetch streaming sources
  const sourcesRes = await fetch(
    `${BASE}/title/${match.id}/sources/?apiKey=${KEY}&regions=US`,
    { next: { revalidate: 86400 } },
  )
  if (!sourcesRes.ok) return NextResponse.json([], { status: 200 })

  const sources: any[] = await sourcesRes.json()

  // Deduplicate by name+type, keep cheapest price
  const seen = new Map<string, any>()
  for (const s of sources) {
    const key = `${s.name}__${s.type}`
    const existing = seen.get(key)
    if (!existing || (s.price != null && (existing.price == null || s.price < existing.price))) {
      seen.set(key, s)
    }
  }

  const result = [...seen.values()].map((s) => ({
    name: s.name,
    type: s.type as string,
    webUrl: s.web_url,
    price: s.price != null ? `$${Number(s.price).toFixed(2)}` : undefined,
  }))

  return NextResponse.json(result)
}
