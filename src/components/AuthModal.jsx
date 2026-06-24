import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'email',  label: 'بريد إلكتروني' },
  { id: 'phone',  label: 'رقم الهاتف'    },
]

export default function AuthModal({ onClose }) {
  const { loginEmail, signupEmail, loginGoogle, sendOTP } = useAuth()

  const [tab,      setTab]      = useState('email')   // 'email' | 'phone'
  const [mode,     setMode]     = useState('login')   // 'login' | 'signup'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [phone,    setPhone]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [confirm,  setConfirm]  = useState(null)      // confirmationResult from Firebase
  const [step,     setStep]     = useState('phone')   // 'phone' | 'otp'
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const wrap = async (fn) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
      onClose()
    } catch (e) {
      setErr(friendlyError(e.code))
    } finally {
      setBusy(false)
    }
  }

  const handleEmail = () => wrap(() =>
    mode === 'login'
      ? loginEmail(email, password)
      : signupEmail(name, email, password)
  )

  const handleGoogle = () => wrap(loginGoogle)

  const handleSendOTP = async () => {
    setErr('')
    setBusy(true)
    try {
      const formatted = formatEgyptPhone(phone)
      const result = await sendOTP(formatted)
      setConfirm(result)
      setStep('otp')
    } catch (e) {
      setErr(friendlyError(e.code))
    } finally {
      setBusy(false)
    }
  }

  const handleVerifyOTP = () => wrap(() => confirm.confirm(otp))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4
        bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      dir="rtl"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-l from-sky-500 to-teal-500 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-lg font-bold">
                {mode === 'signup' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
              </h2>
              <p className="text-sky-100 text-xs mt-0.5">احفظ مفضلاتك على جميع أجهزتك</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/35 rounded-xl text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            متابعة بحساب Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">أو</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Method tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setErr(''); setStep('phone') }}
                className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Email form */}
          {tab === 'email' && (
            <div className="space-y-3">
              {/* Signup/login toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {[['login','دخول'],['signup','حساب جديد']].map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setErr('') }}
                    className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
                      mode === m
                        ? 'bg-white text-teal-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === 'signup' && (
                <input
                  type="text"
                  placeholder="الاسم"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              )}
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                dir="ltr"
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmail()}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                dir="ltr"
              />
              <button
                onClick={handleEmail}
                disabled={busy || !email || !password}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                {busy ? 'جاري...' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
              </button>
            </div>
          )}

          {/* Phone OTP form */}
          {tab === 'phone' && step === 'phone' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="flex items-center px-3 border border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50">
                  🇪🇬 +20
                </span>
                <input
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  dir="ltr"
                  maxLength={11}
                />
              </div>
              <button
                onClick={handleSendOTP}
                disabled={busy || phone.length < 10}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                {busy ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </div>
          )}

          {tab === 'phone' && step === 'otp' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center">
                تم إرسال رمز التحقق إلى{' '}
                <span className="font-semibold text-gray-700" dir="ltr">+20{phone}</span>
              </p>
              <input
                type="text"
                placeholder="رمز التحقق (6 أرقام)"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-center tracking-widest outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                dir="ltr"
                maxLength={6}
              />
              <button
                onClick={handleVerifyOTP}
                disabled={busy || otp.length !== 6}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                {busy ? 'جاري التحقق...' : 'تأكيد الرمز'}
              </button>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setErr('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                تغيير رقم الهاتف
              </button>
            </div>
          )}

          {/* Error */}
          {err && (
            <p className="text-red-500 text-xs text-center bg-red-50 rounded-xl px-3 py-2">
              {err}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function formatEgyptPhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return `+2${digits}`
  if (digits.startsWith('20')) return `+${digits}`
  return `+20${digits}`
}

function friendlyError(code) {
  const map = {
    'auth/invalid-email':              'البريد الإلكتروني غير صحيح',
    'auth/user-not-found':             'لا يوجد حساب بهذا البريد',
    'auth/wrong-password':             'كلمة المرور غير صحيحة',
    'auth/email-already-in-use':       'البريد الإلكتروني مستخدم بالفعل',
    'auth/weak-password':              'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)',
    'auth/invalid-phone-number':       'رقم الهاتف غير صحيح',
    'auth/too-many-requests':          'طلبات كثيرة جداً، حاول لاحقاً',
    'auth/invalid-verification-code':  'رمز التحقق غير صحيح',
    'auth/code-expired':               'انتهت صلاحية الرمز، أعد الإرسال',
    'auth/popup-closed-by-user':       '',
  }
  return map[code] || 'حدث خطأ، حاول مرة أخرى'
}
