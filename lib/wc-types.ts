export interface WCTeam {
  id: number
  name: string
  logo: string
  tla?: string
}

export type WCStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'OTHER'

export interface WCMatch {
  id: number
  homeTeam: WCTeam
  awayTeam: WCTeam
  homeScore: number | null
  awayScore: number | null
  homePenalty?: number | null
  awayPenalty?: number | null
  date: string        // ISO 8601
  status: WCStatus
  minute?: number     // live only
  round: string       // 'Group Stage', 'Round of 16', 'Quarter-finals', etc.
  group?: string      // 'A' | 'B' | ...
  venue?: string
  source: 'api-football' | 'football-data' | 'espn'
}

export interface WCStanding {
  position: number
  team: WCTeam
  playedGames: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  group: string
}

export interface WCEvent {
  minute: number
  extraMinute?: number
  type: 'Goal' | 'Card' | 'Subst' | 'Var' | 'Other'
  detail: string      // 'Normal Goal', 'Own Goal', 'Penalty', 'Yellow Card', 'Red Card', etc.
  teamId: number
  player: string
  assist?: string
}

export interface WCLineupPlayer {
  number: number
  name: string
  pos?: string
}

export interface WCLineup {
  teamId: number
  formation?: string
  startXI: WCLineupPlayer[]
  substitutes: WCLineupPlayer[]
}

export interface WCScorer {
  player: { id: number; name: string; nationality: string }
  team: { id: number; name: string; logo: string }
  goals: number
  assists: number | null
  penalties: number | null
  playedMatches: number
}

// ESPN-sourced team directory + squad
export interface WCTeamInfo {
  id: number
  name: string
  abbreviation: string
  logo: string
  color?: string
}

export interface WCPlayer {
  id: number
  name: string
  jersey: string | null
  position: string      // 'G' | 'D' | 'M' | 'F'
  age: number | null
  height: string | null
  headshot: string | null
}

export interface WCTeamDetail extends WCTeamInfo {
  record: string | null            // e.g. "1-0-0"
  standingSummary: string | null   // e.g. "1st in FIFA World Cup"
  players: WCPlayer[]
}

export interface WCFixtureDetail extends WCMatch {
  events: WCEvent[]
  lineups: WCLineup[]
  homeStats?: Record<string, string | number>
  awayStats?: Record<string, string | number>
}
