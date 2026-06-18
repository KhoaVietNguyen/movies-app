import { NextResponse } from 'next/server'
import { fetchWorldCupHighlights } from '@/lib/wc-highlights'

export async function GET() {
  const items = await fetchWorldCupHighlights()
  return NextResponse.json(items)
}
