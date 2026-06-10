import { useState, useMemo, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import FileUpload from './components/FileUpload'
import Filters from './components/Filters'
import DataTable from './components/DataTable'
import RowModal from './components/RowModal'
import NearbyModal from './components/NearbyModal'

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
  { key: 'المحافظة',           label: 'المحافظة',           multiValue: false },
  { key: 'المنطقة / المدينة', label: 'المنطقة / المدينة', multiValue: false },
  { key: 'نوع مقدم الخدمة',   label: 'نوع مقدم الخدمة',   multiValue: false },
  { key: 'الخدمات المقدمة',   label: 'الخدمات المقدمة',   multiValue: true  },
  { key: 'التخصص',             label: 'التخصص',             multiValue: false },
]

export default function App() {
  const [allRows,    setAllRows]    = useState([])
  const [headers,    setHeaders]    = useState([])
  const [sheetNames, setSheetNames] = useState([])
  const [activeSheet,setActiveSheet]= useState('all')
  const [search,     setSearch]     = useState('')
  const [filters,    setFilters]    = useState({})
  const [selectedRow,setSelectedRow]= useState(null)
  const [showNearby, setShowNearby] = useState(false)
  const [fileName,   setFileName]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

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
              cleaned[key] = v instanceof Date
                ? v.toLocaleDateString('ar-EG')
                : String(v ?? '').trim()
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
        setFilters({})
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
      if (!val) return
      const q = val.toLowerCase()
      rows = rows.filter(row => String(row[key] ?? '').toLowerCase().includes(q))
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
      // Reset city when governorate changes
      if (key === 'المحافظة') next['المنطقة / المدينة'] = ''
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    setAllRows([])
    setHeaders([])
    setSheetNames([])
    setActiveSheet('all')
    setSearch('')
    setFilters({})
    setFileName('')
    setError('')
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
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <HospitalIcon />
            <div>
              <h1 className="text-xl font-bold text-gray-800 leading-tight">دليل المنشآت الطبية</h1>
              <p className="text-xs text-gray-400">منطقة الدلتا</p>
            </div>
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
              onClick={resetAll}
              className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 border border-sky-200 rounded-lg px-3 py-1.5 hover:bg-sky-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              تحديث البيانات
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
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
