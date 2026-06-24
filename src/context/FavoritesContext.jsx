import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'delta-favorites'
const API = '/api/favorites'
const FavoritesContext = createContext(null)

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
  })
  const serverAvailable = useRef(false)

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  // Load from server on mount and merge with any localStorage-only entries
  useEffect(() => {
    apiFetch(API)
      .then(serverFavs => {
        serverAvailable.current = true
        setFavorites(prev => {
          const serverIds = new Set(serverFavs.map(f => f._id))
          // Any entry that exists locally but not on server → push it up
          const localOnly = prev.filter(f => !serverIds.has(f._id))
          localOnly.forEach(row =>
            apiFetch(`${API}/${row._id}`, { method: 'POST', body: JSON.stringify(row) }).catch(() => {})
          )
          return [...serverFavs, ...localOnly]
        })
      })
      .catch(() => {
        serverAvailable.current = false
      })
  }, [])

  const isFavorite = useCallback((id) => {
    return favorites.some(f => f._id === id)
  }, [favorites])

  const toggleFavorite = useCallback((row) => {
    setFavorites(prev => {
      const exists = prev.some(f => f._id === row._id)
      if (exists) {
        if (serverAvailable.current) {
          apiFetch(`${API}/${row._id}`, { method: 'DELETE' }).catch(() => {})
        }
        return prev.filter(f => f._id !== row._id)
      } else {
        if (serverAvailable.current) {
          apiFetch(`${API}/${row._id}`, { method: 'POST', body: JSON.stringify(row) }).catch(() => {})
        }
        return [...prev, row]
      }
    })
  }, [])

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
