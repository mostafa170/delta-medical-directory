import { useState, useEffect, useCallback } from 'react'

const PAGE_SIZE = 50

// Columns that get wider treatment
const WIDE_COLS  = new Set(['مقدم الخدمة', 'العنوان', 'الخدمات المقدمة', 'التخصص'])
const FIXED_COLS = new Set(['Tel. no. - التليفون', 'المحافظة', 'المنطقة / المدينة', 'نوع مقدم الخدمة'])

export default function DataTable({ rows, headers, onRowClick }) {
  const [page, setPage]           = useState(0)
  const [sortCol, setSortCol]     = useState(null)
  const [sortDir, setSortDir]     = useState('asc')
  const [expandedId, setExpanded] = useState(null)

  // Reset page when filter results change
  useEffect(() => { setPage(0) }, [rows])

  const visibleHeaders = headers.filter(h => h !== '_sheet' && h !== '_id')

  // Sorting
  const handleSort = useCallback((col) => {
    setSortCol(prev => {
      if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col }
      setSortDir('asc')
      return col
    })
  }, [])

  const sorted = (() => {
    if (!sortCol) return rows
    return [...rows].sort((a, b) => {
      const va = String(a[sortCol] ?? '').toLowerCase()
      const vb = String(b[sortCol] ?? '').toLowerCase()
      const cmp = va.localeCompare(vb, 'ar')
      return sortDir === 'asc' ? cmp : -cmp
    })
  })()

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageRows   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // ── Empty state ────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center animate-fade-in">
        <svg className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-400 font-semibold text-lg">لا توجد نتائج مطابقة</p>
        <p className="text-gray-300 text-sm mt-1">جرّب تغيير كلمة البحث أو الفلاتر</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-l from-slate-50 to-gray-50 border-b border-gray-200">
              {visibleHeaders.map(h => (
                <th
                  key={h}
                  onClick={() => handleSort(h)}
                  className={`
                    px-4 py-3 font-semibold text-gray-600 whitespace-nowrap
                    cursor-pointer select-none hover:text-sky-600 hover:bg-sky-50/50 transition-colors
                    ${WIDE_COLS.has(h) ? 'min-w-[220px]' : FIXED_COLS.has(h) ? 'min-w-[130px]' : 'min-w-[120px]'}
                  `}
                >
                  <span className="inline-flex items-center gap-1">
                    {h}
                    <SortIcon col={h} sortCol={sortCol} sortDir={sortDir} />
                  </span>
                </th>
              ))}
              <th className="px-3 py-3 w-10 text-gray-400 font-normal text-xs">تفاصيل</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, idx) => {
              const id = row._id || `${page}-${idx}`
              const isExpanded = expandedId === id
              const isEven = idx % 2 === 0

              return [
                <tr
                  key={id}
                  onClick={() => {
                    setExpanded(prev => prev === id ? null : id)
                    onRowClick(row)
                  }}
                  className={`
                    border-b border-gray-100 cursor-pointer transition-colors group clickable
                    ${isEven ? 'bg-white' : 'bg-slate-50/50'}
                    hover:bg-sky-50/70
                    ${isExpanded ? 'bg-sky-50/80' : ''}
                  `}
                >
                  {visibleHeaders.map(h => (
                    <td key={h} className="px-4 py-3 text-gray-700 align-middle">
                      <CellValue value={String(row[h] ?? '')} col={h} />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <svg
                      className={`w-4 h-4 mx-auto transition-all duration-200 ${
                        isExpanded ? 'text-sky-500 rotate-180' : 'text-gray-300 group-hover:text-sky-400'
                      }`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </td>
                </tr>,

                // Inline expanded detail row
                isExpanded && (
                  <tr key={`${id}-detail`} className="bg-sky-50/40">
                    <td colSpan={visibleHeaders.length + 1} className="px-4 py-4">
                      <ExpandedDetail row={row} headers={visibleHeaders} />
                    </td>
                  </tr>
                ),
              ]
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60 flex-wrap gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200
              bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            السابق
          </button>

          <div className="flex items-center gap-1">
            {getPaginationRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`dots-${i}`} className="px-1 text-gray-400 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    p === page
                      ? 'bg-sky-500 text-white font-bold'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {(p + 1).toLocaleString('ar-EG')}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200
              bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            التالي
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────

function CellValue({ value, col }) {
  if (!value) return <span className="text-gray-300">—</span>

  if (col === 'Tel. no. - التليفون') {
    return (
      <a
        href={`tel:${value.replace(/\D/g, '')}`}
        onClick={e => e.stopPropagation()}
        className="text-sky-600 hover:underline whitespace-nowrap font-medium"
        dir="ltr"
      >
        {value}
      </a>
    )
  }

  if (WIDE_COLS.has(col)) {
    return (
      <span className="block max-w-xs line-clamp-2 leading-relaxed">{value}</span>
    )
  }

  return <span className="whitespace-nowrap">{value}</span>
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) {
    return (
      <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
  return (
    <svg className="w-3 h-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
    </svg>
  )
}

function ExpandedDetail({ row, headers }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {headers.map(h => {
        const val = String(row[h] ?? '').trim()
        if (!val) return null
        return (
          <div key={h} className="bg-white rounded-lg p-2.5 border border-sky-100 shadow-xs">
            <p className="text-xs text-gray-400 mb-0.5">{h}</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug break-words">{val}</p>
          </div>
        )
      })}
    </div>
  )
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  if (current <= 3) return [0, 1, 2, 3, 4, '…', total - 1]
  if (current >= total - 4) return [0, '…', total - 5, total - 4, total - 3, total - 2, total - 1]
  return [0, '…', current - 1, current, current + 1, '…', total - 1]
}
