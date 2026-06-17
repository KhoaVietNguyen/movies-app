import { NextResponse } from 'next/server'
import type { WCScorer } from '@/lib/wc-types'

const AF_BASE = 'https://v3.football.api-sports.io'
const AF_KEY = process.env.API_FOOTBALL_KEY!
const FD_BASE = 'https://api.football-data.org/v4'
const FD_KEY = process.env.FOOTBALL_DATA_KEY!
const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world'
const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

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

// ─── ESPN fallback (free, reliable, has WC 2026 scorers) ──────────
// The `leaders` endpoint is slow (~15s) so it's only hit when the other
// sources are empty; result is cached server-side (revalidate below).
async function fromESPN(season: string, limit: number): Promise<WCScorer[]> {
  const lr = await fetch(`${ESPN_CORE}/seasons/${season}/types/1/leaders`, { next: { revalidate: 600 } })
  if (!lr.ok) return []
  const lj = await lr.json()
  const cat = (lj.categories ?? []).find((c: any) => c.name === 'goalsLeaders')
  const leaders: any[] = (cat?.leaders ?? []).slice(0, limit)
  if (leaders.length === 0) return []

  // team id → name/logo (one cheap, day-cached call)
  const teamMap: Record<string, { name: string; logo: string }> = {}
  try {
    const tr = await fetch(`${ESPN_SITE}/teams`, { next: { revalidate: 86400 } })
    if (tr.ok) {
      const td = await tr.json()
      for (const t of td?.sports?.[0]?.leagues?.[0]?.teams ?? []) {
        const tm = t.team
        teamMap[String(tm.id)] = { name: tm.displayName, logo: tm.logos?.[0]?.href ?? '' }
      }
    }
  } catch { /* names only, no logos */ }

  const scorers = await mapLimit(leaders, 8, async (ld): Promise<WCScorer> => {
    const teamId = (ld.team?.$ref ?? '').match(/teams\/(\d+)/)?.[1] ?? ''
    const team = teamMap[teamId] ?? { name: '', logo: '' }
    const matches = /Matches:\s*(\d+)/.exec(ld.displayValue ?? '')
    const assists = /A:\s*(\d+)/.exec(ld.shortDisplayValue ?? '')
    const pid = (ld.athlete?.$ref ?? '').match(/athletes\/(\d+)/)?.[1] ?? ''

    let name = ''
    try {
      const ar = await fetch(ld.athlete.$ref, { next: { revalidate: 86400 } })
      if (ar.ok) {
        const aj = await ar.json()
        name = aj.displayName ?? aj.fullName ?? ''
      }
    } catch { /* skip */ }

    return {
      player: { id: Number(pid) || 0, name, nationality: team.name },
      team: { id: Number(teamId) || 0, name: team.name, logo: team.logo },
      goals: Number(ld.value) || 0,
      assists: assists ? Number(assists[1]) : null,
      penalties: null,
      playedMatches: matches ? Number(matches[1]) : 0,
    }
  })

  return scorers.filter((s) => s.player.name)
}

// ─── api-football normalizer ──────────────────────────────────────
function fromAF(p: any): WCScorer {
  const st = p.statistics?.[0] ?? {}
  return {
    player: {
      id: p.player.id,
      name: p.player.name,
      nationality: p.player.nationality ?? '',
    },
    team: {
      id: st.team?.id ?? 0,
      name: st.team?.name ?? '',
      logo: st.team?.logo ?? '',
    },
    goals: st.goals?.total ?? 0,
    assists: st.goals?.assists ?? null,
    penalties: st.penalty?.scored ?? null,
    playedMatches: st.games?.appearences ?? 0,
  }
}

// ─── football-data normalizer ─────────────────────────────────────
function fromFD(s: any): WCScorer {
  return {
    player: {
      id: s.player.id,
      name: s.player.name,
      nationality: s.player.nationality,
    },
    team: {
      id: s.team.id,
      name: s.team.name,
      logo: s.team.crest ?? '',
    },
    goals: s.goals ?? 0,
    assists: s.assists ?? null,
    penalties: s.penalties ?? null,
    playedMatches: s.playedMatches ?? 0,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const season = searchParams.get('season') ?? '2026'
  const limit = Number(searchParams.get('limit') ?? '20')

  const fetchOpts = season === '2026'
    ? { next: { revalidate: 300 } }
    : { next: { revalidate: 3600 } }

  const [afResult, fdResult] = await Promise.allSettled([
    // api-football: works for free plan seasons 2022–2024
    fetch(`${AF_BASE}/players/topscorers?league=1&season=${season}`, {
      headers: { 'x-apisports-key': AF_KEY }, ...fetchOpts,
    }).then((r) => r.ok ? r.json() : Promise.reject(r.status)),

    // football-data: scorers restricted on free tier (kept as fallback)
    fetch(`${FD_BASE}/competitions/WC/scorers?season=${season}&limit=${limit}`, {
      headers: { 'X-Auth-Token': FD_KEY }, ...fetchOpts,
    }).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
  ])

  if (afResult.status === 'fulfilled') {
    const response = afResult.value?.response
    if (Array.isArray(response) && response.length > 0) {
      return NextResponse.json(response.slice(0, limit).map(fromAF))
    }
  }

  if (fdResult.status === 'fulfilled') {
    const scorers: WCScorer[] = (fdResult.value?.scorers ?? []).map(fromFD)
    if (scorers.length > 0) return NextResponse.json(scorers)
  }

  // Final fallback: ESPN (never empty for 2026, just slower on cold cache)
  try {
    const espn = await fromESPN(season, limit)
    if (espn.length > 0) return NextResponse.json(espn)
  } catch { /* fall through */ }

  console.warn('[WC scorers] no source available', {
    season,
    af: afResult.status === 'rejected' ? afResult.reason : 'empty',
    fd: fdResult.status === 'rejected' ? fdResult.reason : 'empty',
  })
  return NextResponse.json([])
}
