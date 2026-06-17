import { NextResponse } from 'next/server'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'
const TSDB = 'https://www.thesportsdb.com/api/v1/json/123'

// TheSportsDB matches by name; accents miss, so fold them first.
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Square player photo from TheSportsDB (~18KB /small variant).
async function tsdbThumb(name: string): Promise<string | null> {
  if (!name) return null
  try {
    const q = encodeURIComponent(stripAccents(name))
    const res = await fetch(`${TSDB}/searchplayers.php?p=${q}`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    const list: any[] = data?.player ?? []
    const hit = list.find((p) => p.strSport === 'Soccer') ?? list[0]
    const url = hit?.strThumb
    return url ? `${url}/small` : null
  } catch {
    return null
  }
}

// Bounded concurrency so we don't hammer TheSportsDB's free tier.
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

// Returns { [playerName]: photoUrl }. Loaded separately from the roster so the
// player list renders instantly while photos stream in. Cached 1 day.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const res = await fetch(`${ESPN}/teams/${id}/roster`, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json({})
    const roster = await res.json()
    const names: string[] = (roster?.athletes ?? []).map(
      (a: any) => a.displayName ?? a.fullName ?? '',
    )

    const photos = await mapLimit(names, 8, tsdbThumb)
    const map: Record<string, string> = {}
    names.forEach((n, idx) => {
      if (n && photos[idx]) map[n] = photos[idx]!
    })

    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}
