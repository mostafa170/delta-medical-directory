export default function Filters({
  search, onSearch,
  filterColumns, filterOptions,
  filters, onFilterChange,
  resultCount, totalCount,
}) {
  const hasActive = search.trim() || Object.values(filters).some(Boolean)

  const clearAll = () => {
    onSearch('')
    filterColumns.forEach(({ key }) => onFilterChange(key, ''))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="ابحث في جميع الحقول: الاسم، العنوان، التخصص، الهاتف…"
          className="w-full pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent
            text-sm text-gray-700 placeholder-gray-400 transition"
          style={{ paddingLeft: search ? '2.5rem' : '1rem' }}
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute inset-y-0 left-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown filters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {filterColumns.map(({ key, label }) => {
          const isCityFilter = key === 'المنطقة / المدينة'
          const govSelected  = !!filters['المحافظة']
          const isDisabled   = isCityFilter && !govSelected

          return (
            <div key={key} className="relative">
              {isCityFilter && !govSelected && (
                <div className="absolute -top-1.5 right-2 z-10">
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                    اختر المحافظة أولاً
                  </span>
                </div>
              )}
              <select
                value={filters[key] || ''}
                onChange={e => onFilterChange(key, e.target.value)}
                disabled={isDisabled}
                className={`
                  w-full py-2 pr-3 text-sm rounded-lg border focus:outline-none
                  focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-colors
                  ${isDisabled
                    ? 'border-gray-100 bg-gray-100 text-gray-300 cursor-not-allowed'
                    : filters[key]
                      ? 'border-sky-300 bg-sky-50 text-sky-700 font-semibold'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }
                `}
              >
                <option value="">{label} — الكل</option>
                {(filterOptions[key] || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`
            inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full
            ${resultCount === 0
              ? 'bg-red-50 text-red-500'
              : 'bg-sky-50 text-sky-600'
            }
          `}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {resultCount.toLocaleString('ar-EG')} نتيجة
          </span>
          {resultCount !== totalCount && (
            <span className="text-xs text-gray-400">
              من أصل {totalCount.toLocaleString('ar-EG')} سجل
            </span>
          )}
        </div>

        {hasActive && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            مسح جميع الفلاتر
          </button>
        )}
      </div>
    </div>
  )
}
