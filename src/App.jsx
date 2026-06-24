import { useState, useMemo, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import FileUpload from './components/FileUpload'
import Filters from './components/Filters'
import DataTable from './components/DataTable'
import RowModal from './components/RowModal'
import NearbyModal from './components/NearbyModal'
import ContactSection from './components/ContactSection'
import FavoritesScreen from './components/FavoritesScreen'
import AuthModal from './components/AuthModal'
import { normalizeArea, normalizeSpecialty } from './normalize'
import ChatAssistant from './components/ChatAssistant'
import { useFavorites } from './context/FavoritesContext'
import { useAuth } from './context/AuthContext'

// Preferred display order for known columns
const COLUMN_ORDER = [
  'مقدم الخدمة',
  'المحافظة',
  'المنطقة / المدينة',
  'العنوان',
  'نوع مقدم الخدمة',
  'التخصص',
  'الخدمات المقدمة',
  'Tel. no. - التليفون',
  'E-MAIL - البريدالإلكتروني',
]

const FILTER_COLUMNS = [
  { key: 'المحافظة',           label: 'المحافظة',           itemLabel: 'محافظة',  multiValue: false, multiSelect: false },
  { key: 'المنطقة / المدينة', label: 'المنطقة / المدينة', itemLabel: 'منطقة',   multiValue: false, multiSelect: true  },
  { key: 'نوع مقدم الخدمة',   label: 'نوع مقدم الخدمة',   itemLabel: 'نوع',     multiValue: false, multiSelect: true  },
  { key: 'الخدمات المقدمة',   label: 'الخدمات المقدمة',   itemLabel: 'خدمة',    multiValue: true,  multiSelect: true  },
  { key: 'التخصص',             label: 'التخصص',             itemLabel: 'تخصص',   multiValue: false, multiSelect: true  },
]

const MULTI_SELECT_KEYS = FILTER_COLUMNS.filter(f => f.multiSelect).map(f => f.key)
const EMPTY_FILTERS = Object.fromEntries(MULTI_SELECT_KEYS.map(k => [k, []]))

export default function App() {
  const [allRows,    setAllRows]    = useState([])
  const [headers,    setHeaders]    = useState([])
  const [sheetNames, setSheetNames] = useState([])
  const [activeSheet,setActiveSheet]= useState('all')
  const [search,     setSearch]     = useState('')
  const [filters,    setFilters]    = useState({ ...EMPTY_FILTERS })
  const [selectedRow,setSelectedRow]= useState(null)
  const [showNearby, setShowNearby] = useState(false)
  const [fileName,   setFileName]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [view,       setView]       = useState('main') // 'main' | 'favorites'
  const [showAuth,   setShowAuth]   = useState(false)

  const { favorites } = useFavorites()
  const { user, logout } = useAuth()

  const handleFile = useCallback((file) => {
    setError('')
    setLoading(true)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })

        const combined = []
        const headerSet = new Set()

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
          jsonData.forEach((row, idx) => {
            const cleaned = {}
            Object.entries(row).forEach(([k, v]) => {
              const key = String(k).trim()
              headerSet.add(key)
              let val = v instanceof Date
                ? v.toLocaleDateString('ar-EG')
                : String(v ?? '').trim()
              if (key === 'المنطقة / المدينة') val = normalizeArea(val)
              if (key === 'التخصص')             val = normalizeSpecialty(val)
              cleaned[key] = val
            })
            combined.push({ ...cleaned, _sheet: sheetName, _id: `${sheetName}-${idx}` })
          })
        })

        // Build column order: known first, then any extras
        const remaining = Array.from(headerSet).filter(h => !COLUMN_ORDER.includes(h))
        const ordered = COLUMN_ORDER.filter(h => headerSet.has(h)).concat(remaining)

        setSheetNames(workbook.SheetNames)
        setHeaders(ordered)
        setAllRows(combined)
        setActiveSheet('all')
        setSearch('')
        setFilters({ ...EMPTY_FILTERS })
      } catch (err) {
        setError('تعذّر قراءة الملف. تأكد أنه ملف Excel صالح بصيغة .xlsx')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    reader.onerror = () => {
      setError('حدث خطأ أثناء قراءة الملف.')
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  // Rows for the currently selected sheet tab
  const sheetRows = useMemo(() => {
    if (activeSheet === 'all') return allRows
    return allRows.filter(r => r._sheet === activeSheet)
  }, [allRows, activeSheet])

  // Unique options per filter column (splits multi-value fields)
  // المنطقة/المدينة is scoped to the currently selected المحافظة
  const filterOptions = useMemo(() => {
    const opts = {}
    const selectedGov = filters['المحافظة'] || ''

    FILTER_COLUMNS.forEach(({ key, multiValue }) => {
      const sourceRows = (key === 'المنطقة / المدينة' && selectedGov)
        ? sheetRows.filter(r => String(r['المحافظة'] ?? '') === selectedGov)
        : sheetRows

      const vals = new Set()
      sourceRows.forEach(row => {
        const raw = String(row[key] ?? '').trim()
        if (!raw) return
        if (multiValue) {
          raw.split(/[,،\n/]/).forEach(v => { const t = v.trim(); if (t) vals.add(t) })
        } else {
          vals.add(raw)
        }
      })
      opts[key] = Array.from(vals).sort((a, b) => a.localeCompare(b, 'ar'))
    })
    return opts
  }, [sheetRows, filters['المحافظة']])

  // Apply filters + search
  const filteredRows = useMemo(() => {
    let rows = sheetRows

    Object.entries(filters).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length === 0) return
        rows = rows.filter(row => val.includes(String(row[key] ?? '').trim()))
      } else {
        if (!val) return
        rows = rows.filter(row => String(row[key] ?? '').toLowerCase().includes(val.toLowerCase()))
      }
    })

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(row =>
        headers.some(h => String(row[h] ?? '').toLowerCase().includes(q))
      )
    }

    return rows
  }, [sheetRows, filters, search, headers])

  const handleFilterChange = useCallback((key, val) => {
    setFilters(prev => {
      const next = { ...prev, [key]: val }
      // Reset all multi-select fields when governorate changes
      if (key === 'المحافظة') MULTI_SELECT_KEYS.forEach(k => { next[k] = [] })
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    setAllRows([])
    setHeaders([])
    setSheetNames([])
    setActiveSheet('all')
    setSearch('')
    setFilters({ ...EMPTY_FILTERS })
    setFileName('')
    setError('')
    setView('main')
  }, [])

  // Auto-load the bundled Delta database on first mount
  useEffect(() => {
    setLoading(true)
    fetch('/Delta.xlsx')
      .then(res => {
        if (!res.ok) throw new Error('not found')
        return res.arrayBuffer()
      })
      .then(buffer => {
        handleFile(new File([buffer], 'Delta.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }))
      })
      .catch(() => {
        setLoading(false) // file not found — fall back to upload screen
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload screen ─────────────────────────────────────────────
  if (allRows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex flex-col">
        <header className="bg-white/80 backdrop-blur border-b border-sky-100 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HospitalIcon />
              <div>
                <h1 className="text-xl font-bold text-gray-800 leading-tight">دليل المنشآت الطبية</h1>
                <p className="text-xs text-gray-400">منطقة الدلتا</p>
              </div>
            </div>
            <AuthButton user={user} onLogin={() => setShowAuth(true)} onLogout={logout} />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xl">
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <FileUpload onFile={handleFile} loading={loading} />
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <HospitalIcon size="sm" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-800 leading-tight truncate">
                دليل المنشآت الطبية
              </h1>
              <p className="text-xs text-gray-400 truncate">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNearby(true)}
              className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              القريبة منك
            </button>
            <button
              onClick={() => setView(v => v === 'favorites' ? 'main' : 'favorites')}
              className={`relative flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors ${
                view === 'favorites'
                  ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                  : 'text-rose-600 hover:text-rose-800 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                fill={view === 'favorites' ? 'currentColor' : 'none'}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              المفضلة
              {favorites.length > 0 && (
                <span className={`absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] rounded-full text-xs font-bold flex items-center justify-center px-1 ${
                  view === 'favorites' ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'
                }`}>
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 border border-sky-200 rounded-lg px-3 py-1.5 hover:bg-sky-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              تحديث البيانات
            </button>
            <AuthButton user={user} onLogin={() => setShowAuth(true)} onLogout={logout} />
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
        {view === 'favorites' ? (
          <>
            {/* Favorites header bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-500 fill-rose-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800 leading-tight">المفضلة</h2>
                  <p className="text-xs text-gray-400">
                    {favorites.length === 0
                      ? 'لا توجد منشآت محفوظة'
                      : `${favorites.length.toLocaleString('ar-EG')} منشأة محفوظة`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setView('main')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700
                  border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                رجوع للقائمة
              </button>
            </div>

            <FavoritesScreen onRowClick={setSelectedRow} />
          </>
        ) : (
          <>
            {/* Sheet tabs */}
            {sheetNames.length > 1 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                <SheetTab
                  label={`الكل (${allRows.length.toLocaleString('ar-EG')})`}
                  active={activeSheet === 'all'}
                  onClick={() => setActiveSheet('all')}
                />
                {sheetNames.map(name => (
                  <SheetTab
                    key={name}
                    label={`${name} (${allRows.filter(r => r._sheet === name).length.toLocaleString('ar-EG')})`}
                    active={activeSheet === name}
                    onClick={() => setActiveSheet(name)}
                  />
                ))}
              </div>
            )}

            {/* Nextcare contact section */}
            <ContactSection />

            {/* Search + filters */}
            <Filters
              search={search}
              onSearch={setSearch}
              filterColumns={FILTER_COLUMNS}
              filterOptions={filterOptions}
              filters={filters}
              onFilterChange={handleFilterChange}
              resultCount={filteredRows.length}
              totalCount={sheetRows.length}
            />

            {/* Data table */}
            <DataTable
              rows={filteredRows}
              headers={headers}
              onRowClick={setSelectedRow}
            />
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedRow && (
        <RowModal
          row={selectedRow}
          headers={headers}
          onClose={() => setSelectedRow(null)}
        />
      )}

      {/* Nearby modal */}
      {showNearby && (
        <NearbyModal
          rows={filteredRows.length < allRows.length ? filteredRows : allRows}
          onClose={() => setShowNearby(false)}
          onRowClick={(row) => { setSelectedRow(row); setShowNearby(false) }}
        />
      )}

      {/* AI chat assistant */}
      <ChatAssistant allRows={allRows} />

      {/* Auth modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

function HospitalIcon({ size = 'md' }) {
  const cls = size === 'sm'
    ? 'w-8 h-8 rounded-lg'
    : 'w-11 h-11 rounded-xl'
  return (
    <div className={`${cls} bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shrink-0 shadow-sm`}>
      <svg className={size === 'sm' ? 'w-4 h-4 text-white' : 'w-6 h-6 text-white'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  )
}

function AuthButton({ user, onLogin, onLogout }) {
  const [open, setOpen] = useState(false)
  if (!user) {
    return (
      <button
        onClick={onLogin}
        className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 border border-sky-200 rounded-lg px-3 py-1.5 hover:bg-sky-50 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        تسجيل الدخول
      </button>
    )
  }
  const initials = (user.displayName || user.email || '؟').charAt(0).toUpperCase()
  const name     = user.displayName || user.email?.split('@')[0] || 'مستخدم'
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
      >
        {user.photoURL
          ? <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
          : <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">{initials}</span>
        }
        <span className="text-gray-700 max-w-[100px] truncate">{name}</span>
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-44 z-50" dir="rtl">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400">مسجّل كـ</p>
            <p className="text-sm font-medium text-gray-700 truncate">{user.email || user.phoneNumber}</p>
          </div>
          <button
            onClick={() => { onLogout(); setOpen(false) }}
            className="w-full text-right px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  )
}

function SheetTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-sky-500 text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-sky-300 hover:text-sky-600'
      }`}
    >
      {label}
    </button>
  )
}
