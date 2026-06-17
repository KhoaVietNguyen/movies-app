import { NextResponse } from 'next/server'
import type { WCFixtureDetail, WCEvent, WCLineup, WCStatus } from '@/lib/wc-types'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

function espnStatus(state: string): WCStatus {
  if (state === 'in') return 'LIVE'
  if (state === 'post') return 'FINISHED'
  if (state === 'pre') return 'SCHEDULED'
  return 'OTHER'
}

function mapEvent(e: any): WCEvent | null {
  const text: string = e.type?.text ?? ''
  let type: WCEvent['type']
  if (e.scoringPlay || /goal/i.test(text)) type = 'Goal'
  else if (/card/i.test(text)) type = 'Card'
  else if (/substitution/i.test(text)) type = 'Subst'
  else if (/var/i.test(text)) type = 'Var'
  else return null

  const disp: string = e.clock?.displayValue ?? ''
  const mm = disp.match(/(\d+)(?:'?\+(\d+))?/)
  const detail = /red card/i.test(text) ? 'Red Card' : /yellow card/i.test(text) ? 'Yellow Card' : text

  return {
    minute: mm ? Number(mm[1]) : 0,
    extraMinute: mm && mm[2] ? Number(mm[2]) : undefined,
    type,
    detail,
    teamId: Number(e.team?.id ?? 0),
    player: e.participants?.[0]?.athlete?.displayName ?? '',
    assist: type === 'Goal' ? e.participants?.[1]?.athlete?.displayName : undefined,
  }
}

function statsOf(team: any): Record<string, string> {
  const o: Record<string, string> = {}
  for (const s of team?.statistics ?? []) {
    if (s.name && s.displayValue != null) o[s.name] = String(s.displayValue)
  }
  return o
}

// Match detail is keyed by ESPN event id (matches now come from ESPN).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const res = await fetch(`${ESPN}/summary?event=${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return NextResponse.json(null)
    const j = await res.json()

    const comp = j.header?.competitions?.[0]
    if (!comp) return NextResponse.json(null)
    const home = comp.competitors.find((c: any) => c.homeAway === 'home')
    const away = comp.competitors.find((c: any) => c.homeAway === 'away')
    const state = comp.status?.type?.state ?? 'post'
    const scored = state !== 'pre'

    const events: WCEvent[] = (j.keyEvents ?? [])
      .map(mapEvent)
      .filter((e: WCEvent | null): e is WCEvent => e !== null)
      // ESPN lists newest-last; show chronological
      .sort((a: WCEvent, b: WCEvent) => a.minute - b.minute || (a.extraMinute ?? 0) - (b.extraMinute ?? 0))

    const lineups: WCLineup[] = (j.rosters ?? [])
      .filter((r: any) => (r.roster ?? []).length > 0)
      .map((r: any) => ({
        teamId: Number(r.team?.id ?? 0),
        formation: r.formation ?? undefined,
        startXI: (r.roster ?? [])
          .filter((p: any) => p.starter)
          .map((p: any) => ({ number: Number(p.jersey) || 0, name: p.athlete?.displayName ?? '', pos: p.position?.abbreviation })),
        substitutes: (r.roster ?? [])
          .filter((p: any) => !p.starter)
          .map((p: any) => ({ number: Number(p.jersey) || 0, name: p.athlete?.displayName ?? '' })),
      }))

    const boxHome = (j.boxscore?.teams ?? []).find((t: any) => t.homeAway === 'home')
    const boxAway = (j.boxscore?.teams ?? []).find((t: any) => t.homeAway === 'away')

    const detail: WCFixtureDetail = {
      id: Number(id),
      homeTeam: { id: Number(home?.team?.id ?? 0), name: home?.team?.displayName ?? '', logo: home?.team?.logos?.[0]?.href ?? '' },
      awayTeam: { id: Number(away?.team?.id ?? 0), name: away?.team?.displayName ?? '', logo: away?.team?.logos?.[0]?.href ?? '' },
      homeScore: scored ? Number(home?.score) : null,
      awayScore: scored ? Number(away?.score) : null,
      homePenalty: home?.shootoutScore != null ? Number(home.shootoutScore) : null,
      awayPenalty: away?.shootoutScore != null ? Number(away.shootoutScore) : null,
      date: comp.date ?? j.header?.competitions?.[0]?.date ?? '',
      status: espnStatus(state),
      round: '',
      venue: j.gameInfo?.venue?.fullName ?? undefined,
      source: 'espn',
      events,
      lineups,
      homeStats: statsOf(boxHome),
      awayStats: statsOf(boxAway),
    }

    return NextResponse.json(detail)
  } catch (e) {
    console.warn('[WC fixture]', e)
    return NextResponse.json(null)
  }
}
