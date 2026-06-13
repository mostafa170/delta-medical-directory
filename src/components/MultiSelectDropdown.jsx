import { useState, useEffect, useRef, useMemo } from 'react'

export default function MultiSelectDropdown({
  label,
  itemLabel = 'عنصر',  // singular noun used in count badge & search placeholder
  options = [],
  selected = [],   // string[]
  onChange,        // (string[]) => void
  disabled = false,
  hint,
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchRef    = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  const filtered = useMemo(() =>
    search.trim()
      ? options.filter(o => o.includes(search.trim()))
      : options
  , [options, search])

  const toggle = (val) => {
    onChange(selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val]
    )
  }

  const selectAll = () => onChange(filtered.length === options.length ? filtered : [...new Set([...selected, ...filtered])])
  const clearAll  = () => onChange(selected.filter(v => !filtered.includes(v)))

  const triggerLabel = selected.length === 0
    ? `${label} — الكل`
    : `${selected.length} ${itemLabel} محدد`

  return (
    <div ref={containerRef} className="relative">
      {/* Hint badge */}
      {hint && (
        <div className="absolute -top-1.5 right-2 z-10 pointer-events-none">
          <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
            {hint}
          </span>
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`
          w-full py-2 pr-3 pl-8 text-sm rounded-lg border text-right transition-colors
          focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent
          ${disabled
            ? 'border-gray-100 bg-gray-100 text-gray-300 cursor-not-allowed'
            : selected.length > 0
              ? 'border-sky-300 bg-sky-50 text-sky-700 font-semibold'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-sky-200'
          }
        `}
        style={{ backgroundImage: 'none' }}
      >
        <span className="block truncate">{triggerLabel}</span>
        {/* Chevron */}
        <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown panel */}
      {open && !disabled && (
        <div className="absolute top-full mt-1 z-40 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`ابحث عن ${itemLabel}…`}
                className="w-full pr-8 pl-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200
                  focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 left-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Select all / clear row */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={selectAll}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium transition-colors"
            >
              تحديد الكل {search ? `(${filtered.length})` : ''}
            </button>
            <span className="text-gray-300 text-xs">|</span>
            <button
              onClick={clearAll}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              إلغاء التحديد
            </button>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">لا توجد نتائج</p>
            ) : (
              filtered.map(opt => {
                const isChecked = selected.includes(opt)
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${isChecked ? 'bg-sky-50' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(opt)}
                      className="w-4 h-4 rounded accent-sky-500 shrink-0"
                    />
                    <span className={`text-sm leading-tight ${isChecked ? 'text-sky-700 font-medium' : 'text-gray-700'}`}>
                      {opt}
                    </span>
                  </label>
                )
              })
            )}
          </div>

          {/* Footer: selected count + done */}
          {selected.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs text-sky-600 font-medium">
                {selected.length} {itemLabel} محدد
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-xs bg-sky-500 text-white px-3 py-1 rounded-lg hover:bg-sky-600 transition-colors"
              >
                تم
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
