'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const COUNTRIES = [
  { code: 'US', flag: '🇺🇸', name: 'Mỹ' },
  { code: 'KR', flag: '🇰🇷', name: 'Hàn Quốc' },
  { code: 'JP', flag: '🇯🇵', name: 'Nhật Bản' },
  { code: 'CN', flag: '🇨🇳', name: 'Trung Quốc' },
  { code: 'HK', flag: '🇭🇰', name: 'Hồng Kông' },
  { code: 'TW', flag: '🇹🇼', name: 'Đài Loan' },
  { code: 'TH', flag: '🇹🇭', name: 'Thái Lan' },
  { code: 'IN', flag: '🇮🇳', name: 'Ấn Độ' },
  { code: 'GB', flag: '🇬🇧', name: 'Anh' },
  { code: 'FR', flag: '🇫🇷', name: 'Pháp' },
  { code: 'DE', flag: '🇩🇪', name: 'Đức' },
  { code: 'IT', flag: '🇮🇹', name: 'Ý' },
  { code: 'ES', flag: '🇪🇸', name: 'Tây Ban Nha' },
  { code: 'VN', flag: '🇻🇳', name: 'Việt Nam' },
  { code: 'AU', flag: '🇦🇺', name: 'Úc' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
]

interface Props {
  selectedCountry: string | null
  onCountryChange: (code: string | null) => void
}

interface Pos { top: number; left: number }

export default function CountryPicker({ selectedCountry, onCountryChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

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

  const handlePick = (code: string | null) => {
    onCountryChange(code)
    setOpen(false)
  }

  const current = COUNTRIES.find((c) => c.code === selectedCountry)
  const isMobile = mounted && window.innerWidth < 640

  const Grid = () => (
    <div className="grid grid-cols-2 gap-px">
      {COUNTRIES.map((c) => (
        <button
          type="button"
          key={c.code}
          onClick={() => handlePick(c.code)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCountry === c.code
              ? 'bg-orange-500/20 text-orange-300'
              : 'text-zinc-500 hover:text-white hover:bg-white/[0.07] active:bg-white/[0.1]'
          }`}
        >
          <span className="text-base leading-none">{c.flag}</span>
          <span className="truncate">{c.name}</span>
          {selectedCountry === c.code && <span className="ml-auto shrink-0 text-orange-400 text-xs">✓</span>}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
          selectedCountry !== null
            ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
            : 'bg-white/[0.05] text-zinc-400 border-white/[0.08] hover:text-zinc-200 hover:border-white/[0.18]'
        }`}
      >
        <span className="text-base leading-none">{current?.flag ?? '🌍'}</span>
        <span className="hidden sm:inline max-w-[80px] truncate">{current?.name ?? 'Quốc gia'}</span>
        <span className={`text-[10px] opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Desktop dropdown */}
      {mounted && open && !isMobile && createPortal(
        <div
          ref={portalRef}
          className="fixed z-[999] w-64 genre-picker-surface rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-fade-down genre-dropdown-pos"
          style={{ '--dt': `${pos.top}px`, '--dl': `${pos.left}px` } as React.CSSProperties}
        >
          <div className="p-2 pb-1">
            <button
              type="button"
              onClick={() => handlePick(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                selectedCountry === null
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <span>🌍</span>
              <span>Tất cả quốc gia</span>
              {selectedCountry === null && <span className="ml-auto text-orange-400 text-xs">✓</span>}
            </button>
          </div>
          <div className="mx-3 h-px bg-white/[0.06]" />
          <div className="p-2"><Grid /></div>
        </div>,
        document.body,
      )}

      {/* Mobile bottom sheet */}
      {mounted && open && isMobile && createPortal(
        <div
          ref={portalRef}
          className="fixed inset-0 z-[999] flex items-end bg-black/60 backdrop-blur-sm animate-fade-up [animation-duration:0.2s]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full genre-picker-surface rounded-t-2xl px-4 pt-3 pb-6 animate-fade-up [animation-duration:0.25s]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <p className="text-white font-bold text-sm mb-3">Chọn quốc gia</p>
            <button
              type="button"
              onClick={() => handlePick(null)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer mb-2 ${
                selectedCountry === null
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-zinc-400 active:text-white active:bg-white/[0.07]'
              }`}
            >
              <span>🌍</span><span>Tất cả quốc gia</span>
              {selectedCountry === null && <span className="ml-auto text-orange-400">✓</span>}
            </button>
            <Grid />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
