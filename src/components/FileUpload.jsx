import { useCallback, useState, useRef } from 'react'

export default function FileUpload({ onFile, loading }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback((file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('يرجى رفع ملف Excel بصيغة .xlsx أو .xls')
      return
    }
    onFile(file)
  }, [onFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 sm:p-16 text-center
          transition-all duration-200 select-none
          ${loading
            ? 'border-sky-300 bg-sky-50 cursor-wait'
            : dragging
              ? 'border-sky-400 bg-sky-50 scale-[1.01]'
              : 'border-gray-300 bg-white cursor-pointer hover:border-sky-300 hover:bg-sky-50/40'
          }
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin" />
            <p className="text-sky-600 font-semibold">جاري قراءة الملف…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
              dragging ? 'bg-sky-100' : 'bg-gray-100'
            }`}>
              <svg
                className={`w-10 h-10 transition-colors ${dragging ? 'text-sky-500' : 'text-gray-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div>
              <p className="text-xl font-bold text-gray-700">ارفع ملف Excel</p>
              <p className="text-gray-400 text-sm mt-1">اسحب الملف هنا أو انقر للاختيار</p>
              <p className="text-gray-300 text-xs mt-2">يدعم صيغة .xlsx و .xls</p>
            </div>

            <div className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors shadow-sm">
              اختر ملفاً
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => processFile(e.target.files[0])}
      />

      {/* Feature hints */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { icon: '🔍', text: 'بحث فوري في جميع الحقول' },
          { icon: '🗂️', text: 'دعم أوراق متعددة' },
          { icon: '📱', text: 'تصميم متجاوب RTL' },
        ].map(({ icon, text }) => (
          <div key={text} className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-xs text-gray-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
