import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)
const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginEmail  = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
  const signupEmail = async (name, email, pw) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pw)
    if (name) await updateProfile(cred.user, { displayName: name })
    return cred
  }
  const loginGoogle = () => signInWithPopup(auth, googleProvider)

  const sendOTP = (phone) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      })
    }
    return signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, loginEmail, signupEmail, loginGoogle, sendOTP, logout }}>
      <div id="recaptcha-container" />
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
