import { useEffect } from 'react'
import FavoriteButton from './FavoriteButton'

const FIELD_META = {
  'مقدم الخدمة':              { icon: '🏥', span: 2 },
  'المحافظة':                  { icon: '📍', span: 1 },
  'المنطقة / المدينة':        { icon: '🗺️', span: 1 },
  'العنوان':                   { icon: '📌', span: 2 },
  'نوع مقدم الخدمة':          { icon: '🏷️', span: 1 },
  'التخصص':                    { icon: '⚕️', span: 1 },
  'الخدمات المقدمة':          { icon: '🩺', span: 2 },
  'Tel. no. - التليفون':      { icon: '📞', span: 1 },
  'E-MAIL - البريدالإلكتروني':{ icon: '✉️', span: 1 },
}

export default function RowModal({ row, headers, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const visibleHeaders = headers.filter(h => h !== '_sheet' && h !== '_id')
  const name = String(row['مقدم الخدمة'] ?? '').trim() || 'تفاصيل المنشأة'
  const tel  = String(row['Tel. no. - التليفون'] ?? '').trim()

  const mapsUrl = (() => {
    const parts = [
      String(row['مقدم الخدمة'] ?? '').replace(/\r\n|\n/g, ' ').trim(),
      String(row['العنوان'] ?? '').trim(),
      String(row['المنطقة / المدينة'] ?? '').trim(),
      String(row['المحافظة'] ?? '').trim(),
      'مصر',
    ].filter(Boolean)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4
        bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="
        bg-white w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh]
        rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden
        animate-slide-up
      ">

        {/* Header */}
        <div className="bg-gradient-to-l from-sky-500 to-teal-500 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sky-100 text-xs mb-1">تفاصيل المنشأة الطبية</p>
              <h2 className="text-white text-lg font-bold leading-snug line-clamp-2">{name}</h2>
              {row['_sheet'] && (
                <span className="inline-flex items-center mt-1.5 gap-1 text-xs bg-white/20 text-white/90 px-2.5 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ورقة: {row['_sheet']}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <FavoriteButton
                row={row}
                light
                className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/35 rounded-xl transition-colors"
              />
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center
                  bg-white/20 hover:bg-white/35 rounded-xl text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Drag indicator (mobile) */}
        <div className="flex justify-center py-2 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-2">
          <div className="grid grid-cols-2 gap-2.5 py-2">
            {visibleHeaders.map(h => {
              const val = String(row[h] ?? '').trim()
              if (!val) return null
              const meta = FIELD_META[h] || { icon: '•', span: 1 }
              return (
                <div
                  key={h}
                  className={`
                    rounded-xl p-3 border border-gray-100 bg-gray-50/60
                    ${meta.span === 2 ? 'col-span-2' : 'col-span-1'}
                  `}
                >
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <span>{meta.icon}</span>
                    <span>{h}</span>
                  </p>
                  {h === 'Tel. no. - التليفون' ? (
                    <a
                      href={`tel:${val.replace(/\D/g, '')}`}
                      className="text-sky-600 font-bold text-sm hover:underline"
                      dir="ltr"
                    >
                      {val}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 leading-relaxed">{val}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-2 bg-gray-50/50">
          <div className="flex gap-2 flex-wrap">
            {tel && (
              <a
                href={`tel:${tel.replace(/\D/g, '')}`}
                className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white
                  text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                اتصال
              </a>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white
                text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              فتح في خرائط جوجل
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600
              hover:bg-gray-100 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
