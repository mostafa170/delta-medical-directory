const CONTACTS = [
  {
    id: 'phone',
    label: 'اتصال مباشر',
    value: '19154',
    display: '19154',
    href: 'tel:19154',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    color: 'bg-sky-500 hover:bg-sky-600',
    ring: 'ring-sky-200',
  },
  {
    id: 'whatsapp',
    label: 'واتساب',
    value: '+971 56 344 8951',
    display: '+971 56 344 8951',
    href: 'https://wa.me/971563448951',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: 'bg-green-500 hover:bg-green-600',
    ring: 'ring-green-200',
  },
  {
    id: 'email',
    label: 'البريد الإلكتروني',
    value: 'cs.eg@nextcarehealth.com',
    display: 'cs.eg@nextcarehealth.com',
    href: 'mailto:cs.eg@nextcarehealth.com',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-rose-500 hover:bg-rose-600',
    ring: 'ring-rose-200',
  },
]

export default function ContactSection() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Red accent bar */}
      <div className="h-1 bg-gradient-to-l from-rose-400 via-rose-500 to-red-600" />

      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">

        {/* Brand + title */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Nextcare logo */}
          <a href="https://www.nextcarehealth.com" target="_blank" rel="noopener noreferrer"
            className="shrink-0">
            <img
              src="https://www.nextcarehealth.com/wp-content/uploads/2021/06/logo.svg"
              alt="Nextcare"
              className="h-8 w-auto object-contain"
              onError={e => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextSibling.style.display = 'flex'
              }}
            />
            {/* Fallback text logo */}
            <span
              className="hidden items-center justify-center h-8 px-3 bg-red-600 text-white text-sm font-bold rounded-lg"
            >
              Nextcare
            </span>
          </a>

          <div className="border-r border-gray-200 pr-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-bold text-gray-700 leading-tight">
                الموافقات الطبية وخدمة العملاء
              </p>
              <span className="text-[10px] bg-red-50 text-red-600 border border-red-100
                px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                شبكة دلتا
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Nextcare — Medical Approvals &amp; Support</p>
          </div>
        </div>

        {/* Contact buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:mr-auto">
          {CONTACTS.map(c => (
            <a
              key={c.id}
              href={c.href}
              target={c.id !== 'phone' ? '_blank' : undefined}
              rel={c.id !== 'phone' ? 'noopener noreferrer' : undefined}
              className={`
                inline-flex items-center gap-1.5 text-white text-xs font-semibold
                px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95
                ring-2 ring-transparent hover:ring-4 ${c.color} ${c.ring}
              `}
            >
              {c.icon}
              <span className="hidden xs:inline">{c.label}</span>
              <span className="font-normal opacity-90 text-[11px]" dir={c.id === 'phone' ? 'ltr' : 'auto'}>
                {c.display}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
