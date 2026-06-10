import { useState, useEffect, useMemo } from 'react'

// Haversine distance in km
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Egyptian governorate capitals — Arabic + English keys
const GOV_COORDS = {
  // Arabic
  'الدقهلية':    [31.0333, 31.3833],
  'كفر الشيخ':  [31.1167, 30.9389],
  'الغربية':     [30.8783, 31.0028],
  'المنوفية':    [30.5972, 30.9828],
  'الشرقية':     [30.7444, 31.7000],
  'القاهرة':     [30.0444, 31.2357],
  'الجيزة':      [30.0131, 31.2089],
  'الإسكندرية': [31.2001, 29.9187],
  'دمياط':       [31.4167, 31.8167],
  'الإسماعيلية':[30.5965, 32.2715],
  'بورسعيد':     [31.2565, 32.2841],
  'السويس':      [29.9737, 32.5263],
  'القليوبية':   [30.3292, 31.2167],
  'البحيرة':     [30.8608, 30.3472],
  'الفيوم':      [29.3084, 30.8428],
  'المنيا':      [28.0871, 30.7618],
  'أسيوط':       [27.1783, 31.1859],
  'سوهاج':       [26.5583, 31.6955],
  'قنا':          [26.1583, 32.7154],
  'الأقصر':      [25.6872, 32.6396],
  'أسوان':        [24.0889, 32.8998],
  'شمال سيناء':  [30.9300, 33.6800],
  'جنوب سيناء':  [28.2800, 33.6300],
  'البحر الأحمر':[26.1000, 34.0000],
  'مطروح':        [31.3500, 27.2333],
  'الوادي الجديد':[25.4500, 29.4600],
  'بني سويف':    [29.0661, 31.0994],
  // English (Governate column)
  'Dakahlia':    [31.0333, 31.3833],
  'Kafr El Sheikh': [31.1167, 30.9389],
  'Gharbia':     [30.8783, 31.0028],
  'Menoufia':    [30.5972, 30.9828],
  'Sharkia':     [30.7444, 31.7000],
  'Cairo':       [30.0444, 31.2357],
  'Giza':        [30.0131, 31.2089],
  'Alexandria':  [31.2001, 29.9187],
  'Damietta':    [31.4167, 31.8167],
  'Ismailia':    [30.5965, 32.2715],
  'Port Said':   [31.2565, 32.2841],
  'Suez':        [29.9737, 32.5263],
  'Qalyubia':    [30.3292, 31.2167],
  'Beheira':     [30.8608, 30.3472],
  'Fayoum':      [29.3084, 30.8428],
  'Minya':       [28.0871, 30.7618],
  'Assiut':      [27.1783, 31.1859],
  'Sohag':       [26.5583, 31.6955],
  'Qena':        [26.1583, 32.7154],
  'Luxor':       [25.6872, 32.6396],
  'Aswan':       [24.0889, 32.8998],
  'North Sinai': [30.9300, 33.6800],
  'South Sinai': [28.2800, 33.6300],
  'Red Sea':     [26.1000, 34.0000],
  'Matrouh':     [31.3500, 27.2333],
  'New Valley':  [25.4500, 29.4600],
  'Beni Suef':   [29.0661, 31.0994],
}

const DISTANCE_OPTIONS = [10, 25, 50, 100, 200]

export default function NearbyModal({ rows, onClose, onRowClick }) {
  const [status,     setStatus]     = useState('requesting') // requesting | ready | error
  const [userCoords, setUserCoords] = useState(null)
  const [maxKm,      setMaxKm]      = useState(50)
  const [errorMsg,   setErrorMsg]   = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMsg('متصفحك لا يدعم تحديد الموقع الجغرافي')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude])
        setStatus('ready')
      },
      () => {
        setStatus('error')
        setErrorMsg('تعذّر الحصول على موقعك. تأكد من منح إذن الموقع للمتصفح.')
      },
      { timeout: 10000 }
    )
  }, [])

  const results = useMemo(() => {
    if (!userCoords) return []
    return rows
      .map(row => {
        const govAr = String(row['المحافظة'] ?? '').trim()
        const govEn = String(row['Governate'] ?? '').trim()
        const coords = GOV_COORDS[govAr] || GOV_COORDS[govEn]
        if (!coords) return null
        const dist = haversine(userCoords[0], userCoords[1], coords[0], coords[1])
        return { ...row, _distance: Math.round(dist) }
      })
      .filter(r => r !== null && r._distance <= maxKm)
      .sort((a, b) => a._distance - b._distance)
  }, [rows, userCoords, maxKm])

  const mapsUrl = (row) => {
    const addr = [
      String(row['مقدم الخدمة'] ?? ''),
      String(row['المنطقة / المدينة'] ?? ''),
      String(row['المحافظة'] ?? ''),
      'مصر',
    ].filter(Boolean).join(' ')
    return `https://www.google.com/maps/search/${encodeURIComponent(addr)}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4
        bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh]
        rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-500 to-teal-500 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-emerald-100 text-xs mb-1">خدمات بالقرب منك</p>
              <h2 className="text-white text-lg font-bold">المنشآت الطبية القريبة</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white/20
                hover:bg-white/35 rounded-xl text-white transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Requesting location */}
          {status === 'requesting' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
              <p className="text-gray-500 font-medium">جاري تحديد موقعك…</p>
              <p className="text-gray-400 text-sm">يرجى السماح للمتصفح بالوصول إلى موقعك</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 px-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-semibold">{errorMsg}</p>
                <p className="text-gray-400 text-sm mt-1">
                  افتح إعدادات المتصفح وأعط الإذن لهذا الموقع
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {status === 'ready' && (
            <div className="p-4">
              {/* Distance filter */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm text-gray-500 font-medium">نطاق البحث:</span>
                {DISTANCE_OPTIONS.map(km => (
                  <button
                    key={km}
                    onClick={() => setMaxKm(km)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      maxKm === km
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {km} كم
                  </button>
                ))}
                <span className="text-xs text-gray-400 mr-auto">
                  {results.length.toLocaleString('ar-EG')} نتيجة
                </span>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📍</div>
                  <p className="text-gray-400 font-medium">لا توجد منشآت في نطاق {maxKm} كم</p>
                  <p className="text-gray-300 text-sm mt-1">جرّب توسيع نطاق البحث</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((row, i) => (
                    <div
                      key={row._id || i}
                      className="bg-gray-50 hover:bg-emerald-50 border border-gray-100
                        hover:border-emerald-200 rounded-xl p-3 transition-colors cursor-pointer group"
                      onClick={() => { onRowClick(row); onClose() }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm leading-snug truncate">
                            {String(row['مقدم الخدمة'] ?? '').replace(/\r\n|\n/g, ' ').trim()}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {row['نوع مقدم الخدمة'] && (
                              <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                                {row['نوع مقدم الخدمة']}
                              </span>
                            )}
                            {row['التخصص'] && (
                              <span className="text-xs text-gray-500 truncate max-w-[180px]">
                                {row['التخصص']}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {[row['المنطقة / المدينة'], row['المحافظة']].filter(Boolean).join('، ')}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`
                            text-xs font-bold px-2.5 py-1 rounded-full
                            ${row._distance <= 10 ? 'bg-emerald-100 text-emerald-700' :
                              row._distance <= 30 ? 'bg-sky-100 text-sky-700' :
                              'bg-gray-100 text-gray-600'}
                          `}>
                            ~ {row._distance} كم
                          </span>
                          <a
                            href={mapsUrl(row)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1
                              opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            خرائط
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer note */}
        {status === 'ready' && (
          <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50/50">
            <p className="text-xs text-gray-400 text-center">
              المسافة تقريبية بناءً على عاصمة المحافظة
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
