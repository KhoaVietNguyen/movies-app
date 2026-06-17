import { NextResponse } from 'next/server'

// Public Invidious instances — try in order until one works
const INSTANCES = [
  'https://iv.datura.network',
  'https://invidious.nerdvpn.de',
  'https://invidious.privacyredirect.com',
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  if (!q) return NextResponse.json(null)

  for (const base of INSTANCES) {
    try {
      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&fields=videoId,title&page=1`,
        { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } },
      )
      if (!res.ok) continue
      const data = await res.json()
      const first = Array.isArray(data) ? data[0] : null
      if (first?.videoId) return NextResponse.json({ videoId: first.videoId })
    } catch {
      // try next instance
    }
  }

  return NextResponse.json(null)
}
