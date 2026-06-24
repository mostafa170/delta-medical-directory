import { useFavorites } from '../context/FavoritesContext'

export default function FavoriteButton({ row, className = '', size = 'md', light = false }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorited = isFavorite(row._id)
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  const colorClass = light
    ? favorited
      ? 'text-white fill-white'
      : 'text-white/60 fill-transparent hover:text-white'
    : favorited
      ? 'text-rose-500 fill-rose-500'
      : 'text-gray-400 fill-transparent hover:text-rose-400'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(row)
      }}
      title={favorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      className={`transition-colors ${className}`}
    >
      <svg
        className={`${iconSize} transition-all duration-200 ${colorClass}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}
