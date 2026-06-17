import type { Movie, MoviePage, MovieTab, Genre, CastMember, Video, MovieDetails } from './types'

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'
export const IMG_W92 = 'https://image.tmdb.org/t/p/w92'
export const IMG_W200 = 'https://image.tmdb.org/t/p/w200'
export const IMG_W500 = 'https://image.tmdb.org/t/p/w500'
export const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original'

function toMovie(r: any): Movie {
  return {
    id: r.id,
    title: r.title,
    overview: r.overview,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    releaseDate: r.release_date,
    voteAverage: r.vote_average,
    voteCount: r.vote_count,
    popularity: r.popularity,
    adult: r.adult,
    originalLanguage: r.original_language,
    originalTitle: r.original_title,
  }
}

async function tmdbFetch(path: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}language=vi-VN`)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

export async function getMovies(tab: MovieTab, page: number): Promise<MoviePage> {
  const path =
    tab === 'trending'
      ? `/trending/movie/week?api_key=${API_KEY}&page=${page}`
      : `/movie/${tab}?api_key=${API_KEY}&page=${page}`
  const data = await tmdbFetch(path)
  return { page: data.page, results: data.results.map(toMovie), totalPages: data.total_pages }
}

export async function searchMovies(query: string, page = 1): Promise<MoviePage> {
  const data = await tmdbFetch(
    `/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
  )
  return { page: data.page, results: data.results.map(toMovie), totalPages: data.total_pages }
}

export async function discoverMovies(
  params: { genreId?: number | null; year?: number | null; country?: string | null },
  page: number,
): Promise<MoviePage> {
  const q = new URLSearchParams({ api_key: API_KEY!, sort_by: 'popularity.desc', page: String(page) })
  if (params.genreId) q.set('with_genres', String(params.genreId))
  if (params.year)    q.set('primary_release_year', String(params.year))
  if (params.country) q.set('with_origin_country', params.country)
  const data = await tmdbFetch(`/discover/movie?${q}`)
  return { page: data.page, results: data.results.map(toMovie), totalPages: data.total_pages }
}

export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch(`/genre/movie/list?api_key=${API_KEY}`)
  return data.genres
}

export async function getMovie(id: number): Promise<Movie> {
  const data = await tmdbFetch(`/movie/${id}?api_key=${API_KEY}`)
  return toMovie(data)
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const [videosData, creditsData, similarData, imagesData] = await Promise.all([
    tmdbFetch(`/movie/${id}/videos?api_key=${API_KEY}`).catch(() => ({ results: [] })),
    tmdbFetch(`/movie/${id}/credits?api_key=${API_KEY}`).catch(() => ({ cast: [] })),
    tmdbFetch(`/movie/${id}/similar?api_key=${API_KEY}&page=1`).catch(() => ({ results: [] })),
    fetch(`${BASE}/movie/${id}/images?api_key=${API_KEY}`).then(r => r.ok ? r.json() : { backdrops: [] }).catch(() => ({ backdrops: [] })),
  ])

  const videos: Video[] = videosData.results
    .filter((v: any) => v.site === 'YouTube')
    .map((v: any) => ({ key: v.key, name: v.name, type: v.type, official: v.official }))

  const cast: CastMember[] = creditsData.cast.slice(0, 8).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profilePath: c.profile_path,
  }))

  const similar: Movie[] = similarData.results.slice(0, 10).map(toMovie)

  const images: string[] = (imagesData.backdrops as any[])
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 15)
    .map((img: any) => img.file_path)

  return { videos, cast, similar, images }
}
