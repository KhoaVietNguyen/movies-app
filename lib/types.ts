export interface Movie {
  id: number
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  voteAverage: number
  voteCount: number
  popularity: number
  adult: boolean
  originalLanguage: string
  originalTitle: string
}

export interface MoviePage {
  page: number
  results: Movie[]
  totalPages: number
}

export type MovieTab = 'now_playing' | 'top_rated' | 'trending' | 'upcoming' | 'anime_popular' | 'anime_top' | 'anime_airing' | 'watchlist' | 'wc'
export type AnimeTab = 'anime_popular' | 'anime_top' | 'anime_airing'
export type AppMode = 'movie' | 'anime' | 'wc'

export interface StreamingSource {
  name: string
  type: string  // 'sub' | 'free' | 'rent' | 'buy'
  webUrl: string
  price?: string
}

export interface TraktInfo {
  rating: number | null
  votes: number | null
  runtime: number | null
  certification: string | null
  watchers: number | null
}

export interface Genre {
  id: number
  name: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
}

export interface Video {
  key: string
  name: string
  type: string
  official: boolean
}

export interface MovieDetails {
  videos: Video[]
  cast: CastMember[]
  similar: Movie[]
  images: string[]  // backdrop file_paths
}
