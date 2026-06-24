import { useState } from 'react'
import FavoriteButton from './FavoriteButton'
import { useFavorites } from '../context/FavoritesContext'

export default function FavoritesScreen({ onRowClick }) {
  const { favorites } = useFavorites()
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [...new Set(
    favorites.map(f => String(f['نوع مقدم الخدمة'] ?? '').trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'ar'))

  const displayed = activeCategory === 'all'
    ? favorites
    : favorites.filter(f => String(f['نوع مقدم الخدمة'] ?? '').trim() === activeCategory)

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 text-rose-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد مفضلات بعد</h3>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          اضغط على أيقونة القلب ❤️ في أي منشأة لإضافتها إلى المفضلة
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Category filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <CategoryTab
          label={`الكل (${favorites.length.toLocaleString('ar-EG')})`}
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {categories.map(cat => (
          <CategoryTab
            key={cat}
            label={`${cat} (${favorites.filter(f => String(f['نوع مقدم الخدمة'] ?? '').trim() === cat).length.toLocaleString('ar-EG')})`}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* Empty category state */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          لا توجد مفضلات في هذا التصنيف
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map(row => (
            <FavoriteCard key={row._id} row={row} onClick={() => onRowClick(row)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FavoriteCard({ row, onClick }) {
  const name      = String(row['مقدم الخدمة'] ?? '').trim() || 'منشأة'
  const type      = String(row['نوع مقدم الخدمة'] ?? '').trim()
  const city      = String(row['المنطقة / المدينة'] ?? '').trim()
  const gov       = String(row['المحافظة'] ?? '').trim()
  const specialty = String(row['التخصص'] ?? '').trim()
  const tel       = String(row['Tel. no. - التليفون'] ?? '').trim()
  const address   = String(row['العنوان'] ?? '').trim()

  const location = [city, gov].filter(Boolean).join(' - ')

  const mapsUrl = (() => {
    const parts = [name.replace(/\r\n|\n/g, ' '), address, city, gov, 'مصر'].filter(Boolean)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
  })()

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md
        transition-all duration-200 overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="bg-gradient-to-l from-sky-50 to-teal-50 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {type && (
              <span className="inline-block text-xs font-medium text-sky-600 bg-sky-50 border border-sky-100 rounded-full px-2 py-0.5 mb-1.5">
                {type}
              </span>
            )}
            <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors">
              {name}
            </h3>
          </div>
          <FavoriteButton
            row={row}
            size="sm"
            className="shrink-0 p-1 rounded-lg hover:bg-rose-50 mt-0.5"
          />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-1.5">
        {specialty && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <span>⚕️</span>
            <span className="line-clamp-1">{specialty}</span>
          </p>
        )}
        {location && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <span>📍</span>
            <span>{location}</span>
          </p>
        )}
        {address && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <span>📌</span>
            <span className="line-clamp-1">{address}</span>
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div
        className="px-4 pb-3 pt-0 flex gap-2 flex-wrap"
        onClick={e => e.stopPropagation()}
      >
        {tel && (
          <a
            href={`tel:${tel.replace(/\D/g, '')}`}
            className="flex items-center gap-1 text-xs bg-sky-500 hover:bg-sky-600 text-white
              px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white
            px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          خرائط
        </a>
        <button
          onClick={onClick}
          className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200
            hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors mr-auto"
        >
          تفاصيل
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function CategoryTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-rose-500 text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-rose-300 hover:text-rose-600'
      }`}
    >
      {label}
    </button>
  )
}
