'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import GenrePicker from './GenrePicker'
import YearPicker from './YearPicker'
import CountryPicker from './CountryPicker'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => CURRENT_YEAR - i)

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
  genres: { id: number; name: string }[]
  selectedGenre: number | null
  selectedYear: number | null
  selectedCountry: string | null
  onGenreChange: (id: number | null) => void
  onYearChange: (year: number | null) => void
  onCountryChange: (code: string | null) => void
  isAnime: boolean
}

export default function FilterBar({
  genres, selectedGenre, selectedYear, selectedCountry,
  onGenreChange, onYearChange, onCountryChange, isAnime,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const activeCount = [
    selectedGenre !== null,
    selectedYear !== null,
    !isAnime && selectedCountry !== null,
  ].filter(Boolean).length

  const selectedGenreName = genres.find(g => g.id === selectedGenre)?.name
  const selectedCountryItem = COUNTRIES.find(c => c.code === selectedCountry)

  return (
    <>
      {/* ── Mobile: single filter button ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`sm:hidden flex items-center gap-1.5 pl-2.5 pr-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
          activeCount > 0
            ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
            : 'bg-white/5 text-zinc-400 border-white/8 hover:text-zinc-200 hover:border-white/18'
        }`}
      >
        <span className="text-sm leading-none">🎚</span>
        <span>Bộ lọc</span>
        {activeCount > 0 && (
          <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-black">
            {activeCount}
          </span>
        )}
        <span className="text-[10px] opacity-50">▾</span>
      </button>

      {/* ── Desktop: individual pickers ── */}
      <div className="hidden sm:flex items-center gap-2">
        <GenrePicker genres={genres} selectedGenre={selectedGenre} onGenreChange={onGenreChange} />
        <YearPicker selectedYear={selectedYear} onYearChange={onYearChange} />
        {!isAnime && <CountryPicker selectedCountry={selectedCountry} onCountryChange={onCountryChange} />}
      </div>

      {/* ── Mobile bottom sheet ── */}
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full bg-zinc-900 border-t border-white/8 rounded-t-2xl px-4 pt-3 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-black text-sm">Bộ lọc</p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => { onGenreChange(null); onYearChange(null); onCountryChange(null) }}
                  className="text-xs text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Genre section */}
            <div className="mb-5">
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-2">Thể loại</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onGenreChange(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    selectedGenre === null
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'text-zinc-400 border-white/10 hover:text-zinc-200 hover:border-white/20'
                  }`}
                >
                  Tất cả
                </button>
                {genres.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onGenreChange(g.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      selectedGenre === g.id
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        : 'text-zinc-400 border-white/10 hover:text-zinc-200 hover:border-white/20'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Year section */}
            <div className="mb-5">
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-2">Năm</p>
              <div className="grid grid-cols-5 gap-1">
                <button
                  type="button"
                  onClick={() => onYearChange(null)}
                  className={`col-span-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedYear === null
                      ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                      : 'text-zinc-500 hover:text-white hover:bg-white/7'
                  }`}
                >
                  Tất cả
                </button>
                {YEARS.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => onYearChange(y)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedYear === y
                        ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                        : 'text-zinc-500 hover:text-white hover:bg-white/7'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Country section — movie only */}
            {!isAnime && (
              <div className="mb-2">
                <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-2">Quốc gia</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onCountryChange(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      selectedCountry === null
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        : 'text-zinc-400 border-white/10 hover:text-zinc-200 hover:border-white/20'
                    }`}
                  >
                    Tất cả
                  </button>
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => onCountryChange(c.code)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                        selectedCountry === c.code
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          : 'text-zinc-400 border-white/10 hover:text-zinc-200 hover:border-white/20'
                      }`}
                    >
                      <span>{c.flag}</span> {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active summary */}
            {activeCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedGenreName && (
                  <span className="flex items-center gap-1 text-[11px] bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2.5 py-1 rounded-full font-semibold">
                    {selectedGenreName}
                    <button type="button" onClick={() => onGenreChange(null)} className="cursor-pointer opacity-60 hover:opacity-100">✕</button>
                  </span>
                )}
                {selectedYear && (
                  <span className="flex items-center gap-1 text-[11px] bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2.5 py-1 rounded-full font-semibold">
                    {selectedYear}
                    <button type="button" onClick={() => onYearChange(null)} className="cursor-pointer opacity-60 hover:opacity-100">✕</button>
                  </span>
                )}
                {selectedCountryItem && (
                  <span className="flex items-center gap-1 text-[11px] bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2.5 py-1 rounded-full font-semibold">
                    {selectedCountryItem.flag} {selectedCountryItem.name}
                    <button type="button" onClick={() => onCountryChange(null)} className="cursor-pointer opacity-60 hover:opacity-100">✕</button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
