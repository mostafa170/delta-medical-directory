import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'delta-favorites'
const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
  })

  useEffect(() => {
    if (!user) {
      try { setFavorites(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []) }
      catch { setFavorites([]) }
      return
    }

    // Real-time sync from Firestore
    const ref = collection(db, 'users', user.uid, 'favorites')
    const unsub = onSnapshot(ref, (snap) => {
      const favs = snap.docs.map(d => d.data())
      setFavorites(favs)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
    })
    return unsub
  }, [user])

  const isFavorite = useCallback((id) =>
    favorites.some(f => f._id === id)
  , [favorites])

  const toggleFavorite = useCallback(async (row) => {
    const exists = favorites.some(f => f._id === row._id)

    if (user) {
      const ref = doc(db, 'users', user.uid, 'favorites', String(row._id))
      if (exists) {
        await deleteDoc(ref)
      } else {
        await setDoc(ref, row)
      }
    } else {
      setFavorites(prev => {
        const next = exists
          ? prev.filter(f => f._id !== row._id)
          : [...prev, row]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [favorites, user])

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
