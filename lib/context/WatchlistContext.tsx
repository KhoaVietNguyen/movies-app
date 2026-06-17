'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Movie } from '@/lib/types'
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist'

interface WatchlistContextValue {
  watchlist: Movie[]
  isInList: (id: number) => boolean
  toggle: (movie: Movie) => void
  count: number
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null)

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<Movie[]>([])

  useEffect(() => {
    setWatchlist(getWatchlist())
  }, [])

  const isInList = useCallback((id: number) => watchlist.some((m) => m.id === id), [watchlist])

  const toggle = useCallback((movie: Movie) => {
    if (isInList(movie.id)) {
      removeFromWatchlist(movie.id)
      setWatchlist((prev) => prev.filter((m) => m.id !== movie.id))
    } else {
      addToWatchlist(movie)
      setWatchlist((prev) => [movie, ...prev])
    }
  }, [isInList])

  return (
    <WatchlistContext.Provider value={{ watchlist, isInList, toggle, count: watchlist.length }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider')
  return ctx
}
