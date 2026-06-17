import { NextResponse } from 'next/server'
import type { WCStanding } from '@/lib/wc-types'

const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings'

function val(entry: any, type: string): number {
  const s = (entry.stats ?? []).find((x: any) => x.type === type)
  return s ? Number(s.value) : 0
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const season = searchParams.get('season') ?? '2026'
  const revalidate = season === '2026' ? 300 : 3600

  try {
    const res = await fetch(`${ESPN_STANDINGS}?season=${season}`, { next: { revalidate } })
    if (!res.ok) return NextResponse.json([])
    const data = await res.json()

    const out: WCStanding[] = []
    for (const g of data.children ?? []) {
      const group = (g.name ?? '').replace(/^Group\s+/i, '')
      for (const e of g.standings?.entries ?? []) {
        out.push({
          position: val(e, 'rank'),
          team: {
            id: Number(e.team.id),
            name: e.team.displayName,
            logo: e.team.logos?.[0]?.href ?? '',
            tla: e.team.abbreviation,
          },
          playedGames: val(e, 'gamesplayed'),
          won: val(e, 'wins'),
          draw: val(e, 'ties'),
          lost: val(e, 'losses'),
          goalsFor: val(e, 'pointsfor'),
          goalsAgainst: val(e, 'pointsagainst'),
          goalDifference: val(e, 'pointdifferential'),
          points: val(e, 'points'),
          group,
        })
      }
    }

    return NextResponse.json(out)
  } catch {
    return NextResponse.json([])
  }
}
