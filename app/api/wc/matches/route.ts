import { NextResponse } from 'next/server'
import type { WCMatch, WCStatus } from '@/lib/wc-types'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'
const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings'

// ESPN scoreboard takes an absolute date window; map each WC edition to its dates.
const SEASON_WINDOW: Record<string, string> = {
  '2026': '20260611-20260719',
  '2022': '20221120-20221218',
}

function espnStatus(state: string): WCStatus {
  if (state === 'in') return 'LIVE'
  if (state === 'post') return 'FINISHED'
  if (state === 'pre') return 'SCHEDULED'
  return 'OTHER'
}

// ESPN calendar entry label → app round name.
const ROUND_LABEL: Record<string, string> = {
  Group: 'Group Stage',
  'Round of 32': 'Round of 32',
  'Rd of 16': 'Round of 16',
  'Round of 16': 'Round of 16',
  Quarterfinals: 'Quarter-finals',
  Semifinals: 'Semi-finals',
  '3rd-Place Match': 'Hạng 3',
  Final: 'Chung kết',
}

function roundFromCalendar(dateISO: string, entries: any[]): string {
  const t = new Date(dateISO).getTime()
  for (const e of entries) {
    const start = new Date(e.startDate).getTime()
    const end = new Date(e.endDate).getTime()
    if (t >= start && t < end) return ROUND_LABEL[e.label] ?? e.label
  }
  return 'Group Stage'
}

function minuteFrom(disp: string | undefined): number | undefined {
  if (!disp) return undefined
  const m = disp.match(/\d+/)
  return m ? Number(m[0]) : undefined
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const season = searchParams.get('season') ?? '2026'
  const window = SEASON_WINDOW[season] ?? SEASON_WINDOW['2026']
  const revalidate = season === '2026' ? 60 : 3600

  try {
    const [sbRes, stRes] = await Promise.all([
      fetch(`${ESPN}/scoreboard?dates=${window}&limit=300`, { next: { revalidate } }),
      fetch(`${ESPN_STANDINGS}?season=${season}`, { next: { revalidate: 3600 } }),
    ])
    if (!sbRes.ok) return NextResponse.json([])
    const sb = await sbRes.json()
    const events: any[] = sb.events ?? []
    const calendar: any[] = sb.leagues?.[0]?.calendar?.[0]?.entries ?? []

    // teamId → group letter (group-stage matches don't carry the group otherwise)
    const groupOf: Record<string, string> = {}
    if (stRes.ok) {
      const st = await stRes.json()
      for (const g of st.children ?? []) {
        const letter = (g.name ?? '').replace(/^Group\s+/i, '')
        for (const e of g.standings?.entries ?? []) groupOf[String(e.team.id)] = letter
      }
    }

    const matches: WCMatch[] = events.map((ev) => {
      const c = ev.competitions[0]
      const home = c.competitors.find((x: any) => x.homeAway === 'home')
      const away = c.competitors.find((x: any) => x.homeAway === 'away')
      const state = c.status?.type?.state ?? 'pre'
      const status = espnStatus(state)
      const round = roundFromCalendar(ev.date, calendar)
      const scored = state !== 'pre'
      return {
        id: Number(ev.id),
        homeTeam: { id: Number(home.team.id), name: home.team.displayName, logo: home.team.logo ?? '', tla: home.team.abbreviation },
        awayTeam: { id: Number(away.team.id), name: away.team.displayName, logo: away.team.logo ?? '', tla: away.team.abbreviation },
        homeScore: scored ? Number(home.score) : null,
        awayScore: scored ? Number(away.score) : null,
        homePenalty: home.shootoutScore != null ? Number(home.shootoutScore) : null,
        awayPenalty: away.shootoutScore != null ? Number(away.shootoutScore) : null,
        date: ev.date,
        status,
        minute: status === 'LIVE' ? minuteFrom(c.status?.displayClock) : undefined,
        round,
        group: round === 'Group Stage' ? groupOf[String(home.team.id)] : undefined,
        venue: c.venue?.fullName,
        source: 'espn',
      }
    })

    return NextResponse.json(matches)
  } catch {
    return NextResponse.json([])
  }
}
