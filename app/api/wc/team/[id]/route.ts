import { NextResponse } from 'next/server'
import type { WCTeamDetail, WCPlayer } from '@/lib/wc-types'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// ESPN full headshots are ~250KB PNGs. The combiner serves a small resized
// thumbnail (120px, ~2× retina for the 60px avatar) — far faster to load.
// Note: ESPN covers almost no national-team players; the real photos come from
// the separate /photos route (TheSportsDB) so the roster list isn't blocked.
function espnThumb(href: string | undefined): string | null {
  if (!href) return null
  try {
    const { pathname } = new URL(href)
    return `https://a.espncdn.com/combiner/i?img=${pathname}&w=120&h=120`
  } catch {
    return null
  }
}

// Squad + team info is essentially static during the tournament → cache 1 day.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const opts = { next: { revalidate: 86400 } }

  try {
    const [infoRes, rosterRes] = await Promise.all([
      fetch(`${ESPN}/teams/${id}`, opts),
      fetch(`${ESPN}/teams/${id}/roster`, opts),
    ])

    const info = infoRes.ok ? await infoRes.json() : null
    const roster = rosterRes.ok ? await rosterRes.json() : null
    const team = info?.team ?? {}
    const athletes: any[] = roster?.athletes ?? []

    const players: WCPlayer[] = athletes.map((a) => ({
      id: Number(a.id),
      name: a.displayName ?? a.fullName ?? '',
      jersey: a.jersey ?? null,
      position: a.position?.abbreviation ?? '?',
      age: a.age ?? null,
      height: a.displayHeight ?? null,
      headshot: espnThumb(a.headshot?.href),
    }))

    const detail: WCTeamDetail = {
      id: Number(id),
      name: team.displayName ?? '',
      abbreviation: team.abbreviation ?? '',
      logo: team.logos?.[0]?.href ?? '',
      color: team.color ? `#${team.color}` : undefined,
      record: team.record?.items?.[0]?.summary ?? null,
      standingSummary: team.standingSummary ?? null,
      players,
    }

    return NextResponse.json(detail)
  } catch {
    return NextResponse.json(null, { status: 500 })
  }
}
