import { NextResponse } from 'next/server'
import type { WCTeamInfo } from '@/lib/wc-types'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// Team directory is static for the whole tournament → cache 1 day.
export async function GET() {
  try {
    const res = await fetch(`${ESPN}/teams`, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json([])
    const data = await res.json()
    const raw = data?.sports?.[0]?.leagues?.[0]?.teams ?? []

    const teams: WCTeamInfo[] = raw
      .map((t: any) => {
        const team = t.team ?? t
        return {
          id: Number(team.id),
          name: team.displayName ?? '',
          abbreviation: team.abbreviation ?? '',
          logo: team.logos?.[0]?.href ?? '',
          color: team.color ? `#${team.color}` : undefined,
        }
      })
      .filter((t: WCTeamInfo) => t.id && t.name && t.logo)
      .sort((a: WCTeamInfo, b: WCTeamInfo) => a.name.localeCompare(b.name))

    return NextResponse.json(teams)
  } catch {
    return NextResponse.json([])
  }
}
