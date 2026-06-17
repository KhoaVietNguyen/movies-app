'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Genre } from '@/lib/types'

const ICONS: Record<number, string> = {
  28: '💥', 12: '🗺️', 16: '🎨', 35: '😂', 80: '🔪',
  99: '🎥', 18: '🎭', 10751: '👨‍👩‍👧', 14: '🧙', 36: '📜',
  27: '👻', 10402: '🎵', 9648: '🔮', 10749: '💕', 878: '🚀',
  10770: '📺', 53: '😰', 10752: '⚔️', 37: '🤠',
}

interface Props {
  genres: Genre[]
  selectedGenre: number | null
  onGenreChange: (id: number | null) => void
}

interface Pos { top: number; left: number }

export default function GenrePicker({ genres, selectedGenre, onGenreChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Close on outside click (capture phase so portal clicks register correctly)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (portalRef.current?.contains(e.target as Node)) return
      if (buttonRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!open) return
    const update = () => {
      if (buttonRef.current) {
        const r = buttonRef.current.getBoundingClientRect()
        setPos({ top: r.bottom + 8, left: r.left })
      }
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left })
    }
    setOpen((o) => !o)
  }

  const handlePick = (id: number | null) => {
    onGenreChange(id)
    setOpen(false)
  }

  const current = genres.find((g) => g.id === selectedGenre)
  const currentIcon = selectedGenre ? (ICONS[selectedGenre] ?? '🎬') : '🎭'
  const label = current ? current.name.replace('Phim ', '') : 'Thể loại'
  const isMobile = mounted && window.innerWidth < 640

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
          selectedGenre !== null
            ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
            : 'bg-white/[0.05] text-zinc-400 border-white/[0.08] hover:text-zinc-200 hover:border-white/[0.18]'
        }`}
      >
        <span className="text-base leading-none">{currentIcon}</span>
        {/* Always show label — truncate on mobile */}
        <span className="max-w-[72px] sm:max-w-[120px] truncate">{label}</span>
        <span className={`text-[10px] opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Portal: desktop dropdown */}
      {mounted && open && !isMobile && createPortal(
        <div
          ref={portalRef}
          className="fixed z-[999] w-72 genre-picker-surface rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-fade-down genre-dropdown-pos"
          style={{ '--dt': `${pos.top}px`, '--dl': `${pos.left}px` } as React.CSSProperties}
        >
          {/* All genres */}
          <div className="p-2 pb-1">
            <button
              type="button"
              onClick={() => handlePick(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                selectedGenre === null
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <span className="text-base">🎬</span>
              <span>Tất cả thể loại</span>
              {selectedGenre === null && <span className="ml-auto text-orange-400 text-xs">✓</span>}
            </button>
          </div>

          <div className="mx-3 h-px bg-white/[0.06]" />

          <div className="p-2 grid grid-cols-2 gap-px">
            {genres.map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => handlePick(g.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedGenre === g.id
                    ? 'bg-orange-500/20 text-orange-300'
                    : 'text-zinc-500 hover:text-white hover:bg-white/[0.07]'
                }`}
              >
                <span className="text-sm shrink-0">{ICONS[g.id] ?? '🎬'}</span>
                <span className="truncate">{g.name.replace('Phim ', '')}</span>
                {selectedGenre === g.id && <span className="ml-auto shrink-0 text-orange-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}

      {/* Portal: mobile bottom sheet */}
      {mounted && open && isMobile && createPortal(
        <div
          id="genre-portal"
          ref={portalRef}
          className="fixed inset-0 z-[999] flex items-end bg-black/60 backdrop-blur-sm animate-fade-up [animation-duration:0.2s]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full genre-picker-surface rounded-t-2xl px-4 pt-3 pb-6 animate-fade-up [animation-duration:0.25s]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <p className="text-white font-bold text-sm mb-3">Chọn thể loại</p>

            <button
              type="button"
              onClick={() => handlePick(null)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer mb-2 ${
                selectedGenre === null
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <span>🎬</span>
              <span>Tất cả thể loại</span>
              {selectedGenre === null && <span className="ml-auto text-orange-400">✓</span>}
            </button>

            <div className="grid grid-cols-4 gap-1.5">
              {genres.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => handlePick(g.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedGenre === g.id
                      ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                      : 'text-zinc-500 bg-white/[0.03] active:bg-white/[0.08] active:text-white'
                  }`}
                >
                  <span className="text-xl leading-none">{ICONS[g.id] ?? '🎬'}</span>
                  <span className="leading-tight text-center line-clamp-2">{g.name.replace('Phim ', '')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
