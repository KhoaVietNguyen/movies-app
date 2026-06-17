import type { Movie, MoviePage, MovieDetails, CastMember, Video, AnimeTab } from './types'

const JIKAN_BASE = 'https://api.jikan.moe/v4'

async function jikanFetch(path: string) {
  const res = await fetch(`${JIKAN_BASE}${path}`)
  if (!res.ok) throw new Error(`Jikan ${res.status}`)
  return res.json()
}

function toAnime(r: any): Movie {
  return {
    id: r.mal_id,
    title: r.title_english ?? r.title ?? '',
    originalTitle: r.title ?? '',
    overview: r.synopsis ?? '',
    posterPath: r.images?.jpg?.large_image_url ?? r.images?.jpg?.image_url ?? null,
    backdropPath: null,
    releaseDate: r.aired?.from ?? r.from ?? '',
    voteAverage: r.score ?? 0,
    voteCount: r.scored_by ?? 0,
    popularity: r.popularity ?? 0,
    adult: false,
    originalLanguage: 'ja',
  }
}

const FILTER: Record<AnimeTab, string> = {
  anime_popular: 'bypopularity',
  anime_top: '',
  anime_airing: 'airing',
}

export async function getAnime(tab: AnimeTab, page: number): Promise<MoviePage> {
  const filter = FILTER[tab]
  const q = filter ? `?filter=${filter}&page=${page}` : `?page=${page}`
  const data = await jikanFetch(`/top/anime${q}`)
  return {
    page: data.pagination?.current_page ?? page,
    results: (data.data ?? []).map(toAnime),
    totalPages: data.pagination?.last_page ?? 1,
  }
}

export async function searchAnime(q: string, page = 1): Promise<MoviePage> {
  const data = await jikanFetch(`/anime?q=${encodeURIComponent(q)}&page=${page}&limit=10&sfw=true`)
  return {
    page: data.pagination?.current_page ?? page,
    results: (data.data ?? []).map(toAnime),
    totalPages: data.pagination?.last_page ?? 1,
  }
}

export async function getAnimeById(id: number): Promise<Movie> {
  const data = await jikanFetch(`/anime/${id}`)
  return toAnime(data.data)
}

export async function getAnimeDetails(id: number): Promise<MovieDetails> {
  const [chars, vids, recs, pics] = await Promise.all([
    jikanFetch(`/anime/${id}/characters`),
    jikanFetch(`/anime/${id}/videos`),
    jikanFetch(`/anime/${id}/recommendations`),
    jikanFetch(`/anime/${id}/pictures`),
  ])

  const cast: CastMember[] = (chars.data ?? []).slice(0, 20).map((c: any) => ({
    id: c.character?.mal_id ?? 0,
    name: c.character?.name ?? '',
    character: c.role ?? '',
    profilePath: c.character?.images?.jpg?.image_url ?? null,
  }))

  const videos: Video[] = (vids.data?.promo ?? [])
    .filter((p: any) => p.trailer?.youtube_id)
    .map((p: any) => ({
      key: p.trailer.youtube_id,
      name: p.title ?? 'Trailer',
      type: 'Trailer',
      official: true,
    }))

  const similar: Movie[] = (recs.data ?? []).slice(0, 12).map((r: any) => toAnime(r.entry))

  // Jikan pictures: each entry has jpg.large_image_url — store full URL directly
  const images: string[] = (pics.data ?? [])
    .map((p: any) => p.jpg?.large_image_url ?? p.jpg?.image_url)
    .filter(Boolean)
    .slice(0, 20)

  return { videos, cast, similar, images }
}
