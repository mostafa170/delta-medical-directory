import { useState, useRef, useEffect, useCallback } from 'react'

// Gemini 2.0 Flash is the primary model — free (1500 req/day, 1M tokens/min via AI Studio)
// Groq / Llama 3.3 70B is the fallback if only VITE_GROQ_API_KEY is set
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY   || ''
const NEXTCARE_WA = '971563448951'

async function chatCompletion(systemPrompt, history, apiKey) {
  const isGemini = apiKey === GEMINI_KEY && !!GEMINI_KEY

  const url = isGemini
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions'

  const model = isGemini ? 'gemini-2.0-flash' : 'llama-3.3-70b-versatile'

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ]

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 1000, temperature: 0.7 }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }
  return (await res.json()).choices[0].message.content
}

// Returns whichever API key is available (Gemini preferred)
function resolveApiKey() {
  return GEMINI_KEY || GROQ_KEY
}

function modelLabel() {
  return GEMINI_KEY ? 'Gemini 2.0 Flash' : 'Llama 3.3'
}

// ── System prompts ───────────────────────────────────────────────

const SYMPTOM_PROMPT = `إنت مساعد طبي بتخدم منطقة الدلتا في مصر. شغلتك إنك تساعد الناس يلاقوا التخصص الطبي الصح.

🗣️ أسلوبك — مهم جداً:
- اتكلم بالعامية المصرية الطبيعية طول الوقت بدون استثناء
- استخدم كلمات زي: إيه، عايز/عايزة، مش، كده، بقاله، إمتى، فين، ليه، أوي، خالص، يعني، طب
- لو حد كتب بالعربيزي (3andy, bet3awerni, dammagh, 2alby) — افهمه وارد بالعامية المصرية
- لو حد كتب مزيج عربي وإنجليزي — افهمه وارد بالعامية المصرية
- لو حد كتب إنجليزي خالص — افهمه وارد بالعامية المصرية

❌ ممنوع تماماً تكتب كده (فصحى):
"ما هي الأعراض؟" / "هل تعاني من؟" / "يُرجى التوضيح" / "أودّ الاستفسار" / "تفضل بذكر"

✅ الصح إنك تكتب كده (عامية):
"إيه اللي بيوجعك بالظبط؟" / "بقاله قد إيه كده؟" / "في حاجة تانية بتحس بيها؟" / "الوجع ده فين بالظبط؟"

أمثلة على ردودك:
• المريض: "وجعني ضرسي" → إنت: "آه وجع الضرس ده صعب 😣 بقاله قد إيه بيوجعك؟ وهو وجع مستمر ولا بيجي ويروح؟"
• المريض: "3andy so3al fel 3en" → إنت: "عندك إيه بالظبط في عينك؟ صعوبة في الرؤية ولا ألم ولا حاجة تانية؟ 👁️"
• المريض: "my knee hurts" → إنت: "ركبتك بتوجعك؟ الوجع ده جديد ولا من فترة؟ وبيوجعك وإنت واقف ولا حتى وإنت قاعد؟"
• المريض: "قلبي بيدق بسرعة" → إنت: "يعني بتحس بخفقان؟ ده بيحصل معاك كتير ولا بس دلوقتي؟ وبتحس بأي حاجة تانية معاه زي ضيق نفس مثلاً؟"

📋 قواعد الإرشاد:
- اسأل 1-3 أسئلة بس عشان تفهم الأعراض كويس
- متشخصش ومتدوش أدوية — إنت بتوجه بس
- لما تتأكد من التخصص المناسب، اكتب في آخر رسالتك: [[SPECIALTY: التخصص]]

التخصصات الموجودة عندنا:
طب الأطفال | طب وجراحة الفم والأسنان | أمراض النساء والتوليد | الباطنة والقلب | طب العيون | الجلدية والتناسلية | الأنف والأذن والحنجرة | جراحة العظام والكسور | الأشعة | المعامل التحليلية`

const APPROVAL_PROMPT = `إنت مساعد بتساعد الناس في طلبات الموافقة الطبية مع شركة Nextcare في مصر.

🗣️ أسلوبك — مهم جداً:
- اتكلم بالعامية المصرية الطبيعية دايماً
- أسلوبك مريح ومطمئن زي ما بتكلم حد محتاج مساعدة
- افهم لو حد كتب عربيزي أو مزيج أو إنجليزي، وارد دايماً بالعامية المصرية
❌ ممنوع الفصحى: "يُرجى" / "تفضّل" / "أودّ الإحاطة"
✅ الصح: "يلا" / "عادي" / "مش مشكلة" / "معاك في أي وقت"

مهمتك:
- وضّح للمريض إنه محتاج: وصفة طبية + بطاقة هوية وطنية + بطاقة تأمين صحي
- قوله يضغط على زر "تعبئة النموذج" اللي تحت يدخل بياناته، وهنجهزله رسالة واتساب جاهزة يبعتها لـ Nextcare`

// ── Provider search ──────────────────────────────────────────────

function normalizeAr(s) {
  return String(s ?? '').replace(/[أإآٱ]/g, 'ا').replace(/\s+/g, ' ').trim().toLowerCase()
}

function findProviders(specialty, gov, area, allRows) {
  if (!allRows.length) return []
  const spNorm = normalizeAr(specialty)

  let pool = allRows
  if (specialty) {
    const bySpec = allRows.filter(r => {
      const rSpec = normalizeAr(r['التخصص'])
      return rSpec.includes(spNorm) || spNorm.includes(rSpec)
    })
    if (bySpec.length > 0) pool = bySpec
  }

  if (gov) {
    const byGov = pool.filter(r => String(r['المحافظة'] ?? '').trim() === gov.trim())
    if (byGov.length > 0) pool = byGov
  }

  if (area) {
    const byArea = pool.filter(r => String(r['المنطقة / المدينة'] ?? '').includes(area.trim()))
    if (byArea.length > 0) pool = byArea
  }

  return pool
    .map(r => ({
      ...r,
      _score:
        (r['العنوان'] ? 1 : 0) +
        (r['Tel. no. - التليفون'] ? 2 : 0) +
        (r['الخدمات المقدمة'] ? 1 : 0),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)
}

function mapsUrl(row) {
  const q = [
    String(row['مقدم الخدمة'] ?? '').replace(/\r\n|\n/g, ' ').trim(),
    String(row['العنوان'] ?? '').trim(),
    String(row['المنطقة / المدينة'] ?? '').trim(),
    String(row['المحافظة'] ?? '').trim(),
    'مصر',
  ].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}


function extractSpecialty(text) {
  const m = text.match(/\[\[SPECIALTY:\s*([^\]]+)\]\]/)
  return m ? m[1].trim() : null
}

function stripTag(text) {
  return text.replace(/\[\[SPECIALTY:[^\]]+\]\]/g, '').trim()
}

// ── Sub-components ───────────────────────────────────────────────

function Bubble({ msg }) {
  if (msg.role === 'system') return null
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
            : 'bg-gradient-to-br from-sky-500 to-teal-500 text-white rounded-tl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

function ProviderCard({ row }) {
  const name    = String(row['مقدم الخدمة'] ?? '').replace(/\r\n|\n/g, ' ').trim()
  const tel     = String(row['Tel. no. - التليفون'] ?? '').trim()
  const address = String(row['العنوان'] ?? '').trim()
  const area    = String(row['المنطقة / المدينة'] ?? '').trim()
  const spec    = String(row['التخصص'] ?? '').trim()

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-right">
      <p className="font-bold text-gray-800 text-sm leading-snug">{name}</p>
      {spec    && <p className="text-xs text-emerald-600 mt-0.5 font-medium">{spec}</p>}
      {area    && <p className="text-xs text-gray-500 mt-0.5">📍 {area}</p>}
      {address && <p className="text-xs text-gray-500 mt-0.5">🏠 {address}</p>}
      <div className="flex gap-2 mt-2.5 justify-end flex-wrap">
        {tel && (
          <a
            href={`tel:${tel.replace(/\D/g, '')}`}
            className="flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
            dir="ltr"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {tel}
          </a>
        )}
        <a
          href={mapsUrl(row)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          خرائط
        </a>
      </div>
    </div>
  )
}

function LocationPicker({ label, options, value, onChange, onSubmit, optional }) {
  return (
    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-right animate-fade-in">
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-sky-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
      >
        <option value="">— اختر —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <button
        onClick={onSubmit}
        disabled={!optional && !value}
        className="w-full py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {optional && !value ? 'تخطي' : 'تأكيد'}
      </button>
    </div>
  )
}

const FORM_FIELDS = [
  { key: 'patientName',  label: 'اسم المريض',               placeholder: 'الاسم الكامل' },
  { key: 'nationalId',   label: 'رقم الهوية الوطنية',       placeholder: '14 رقم' },
  { key: 'insuranceNo',  label: 'رقم التأمين / العضوية',    placeholder: 'رقم العضوية' },
  { key: 'policyNo',     label: 'رقم الوثيقة / البوليصة',   placeholder: 'رقم الوثيقة' },
  { key: 'employer',     label: 'الشركة / صاحب العمل',      placeholder: 'اسم الشركة' },
  { key: 'doctorName',   label: 'اسم الطبيب',               placeholder: 'من الوصفة الطبية' },
  { key: 'diagnosis',    label: 'التشخيص / الحالة المرضية', placeholder: 'مثال: التهاب المفاصل' },
  { key: 'prescription', label: 'الدواء / الإجراء المطلوب', placeholder: 'مثال: أشعة MRI أو دواء ...' },
]

function ApprovalForm({ data, waNumber, onChange, onWaChange, onSubmit }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-right space-y-2">
      <p className="text-sm font-bold text-gray-700">📋 بيانات طلب الموافقة</p>
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500 font-medium">📱 رقم واتساب المريض</p>
        <input
          type="tel" dir="ltr" placeholder="مثال: 01012345678"
          value={waNumber} onChange={e => onWaChange(e.target.value)}
          className="w-full text-xs border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      {FORM_FIELDS.map(f => (
        <div key={f.key} className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">{f.label}</p>
          <input
            type="text" placeholder={f.placeholder}
            value={data[f.key]} onChange={e => onChange(f.key, e.target.value)}
            className="w-full text-xs border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      ))}
      <button
        onClick={onSubmit}
        disabled={!Object.values(data).some(v => v.trim())}
        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors mt-1"
      >
        تجهيز رسالة واتساب ✓
      </button>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex justify-end">
      <div className="bg-gradient-to-br from-sky-500 to-teal-500 rounded-2xl rounded-tl-sm px-5 py-3.5">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────

export default function ChatAssistant({ allRows }) {
  const [open,    setOpen]    = useState(false)
  const [mode,    setMode]    = useState('symptom')  // 'symptom' | 'approval'
  const [msgs,    setMsgs]    = useState([])
  const [input,   setInput]   = useState('')
  const [busy,    setBusy]    = useState(false)
  const apiKey = resolveApiKey()

  // Symptom flow
  const [specialty,   setSpecialty]   = useState(null)
  const [locStep,     setLocStep]     = useState(null) // null | 'gov' | 'area' | 'done'
  const [gov,         setGov]         = useState('')
  const [area,        setArea]        = useState('')

  // Approval flow
  const [approvalStep, setApprovalStep] = useState('chat')  // chat | form | result
  const [waNumber,     setWaNumber]     = useState('')
  const [formData,     setFormData]     = useState({
    patientName: '', nationalId: '', insuranceNo: '', policyNo: '',
    doctorName: '', diagnosis: '', prescription: '', employer: '',
  })

  const bottomRef = useRef(null)

  const greet = useCallback(m => ({
    id: 'greet',
    role: 'assistant',
    content: m === 'symptom'
      ? 'أهلاً! 👋 أنا مساعدك الطبي.\nقولي بيوجعك إيه أو إنت تعبان منين، وأنا هساعدك تلاقي أقرب دكتور متخصص.'
      : 'أهلاً! 👋 أنا هنا أساعدك في طلب موافقة طبية مع Nextcare.\nاضغط على "تعبئة النموذج" تحت، وهنجهزلك رسالة واتساب جاهزة تبعتها على طول.',
  }), [])

  const resetFlow = useCallback(m => {
    setMsgs([greet(m)])
    setInput('')
    setSpecialty(null)
    setLocStep(null)
    setGov('')
    setArea('')
    setApprovalStep('chat')
    setWaNumber('')
    setFormData({ patientName: '', nationalId: '', insuranceNo: '', policyNo: '',
      doctorName: '', diagnosis: '', prescription: '', employer: '' })
    setBusy(false)
  }, [greet])

  const switchMode = useCallback(m => {
    setMode(m)
    resetFlow(m)
  }, [resetFlow])

  useEffect(() => {
    if (open && msgs.length === 0) resetFlow(mode)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, locStep, approvalStep, busy])

  // Unique filter options from data
  const govOptions = [...new Set(allRows.map(r => String(r['المحافظة'] ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'))
  const areaOptions = [...new Set(
    allRows
      .filter(r => !gov || String(r['المحافظة'] ?? '').trim() === gov)
      .map(r => String(r['المنطقة / المدينة'] ?? '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'ar'))

  // ── Send chat message ──────────────────────────────────────────

  const send = useCallback(async (overrideText = null) => {
    if (!apiKey) {
      setMsgs(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: 'عذراً، الخدمة غير متاحة حالياً. يرجى التواصل مع الدعم الفني.',
      }])
      return
    }
    const text = overrideText ?? input.trim()
    if (!text) return

    const userMsg = { id: Date.now(), role: 'user', content: text }
    const history = [...msgs, userMsg]
    setMsgs(history)
    setInput('')
    setBusy(true)

    try {
      const systemPrompt = mode === 'symptom' ? SYMPTOM_PROMPT : APPROVAL_PROMPT
      const apiHistory = history.map(m => ({ role: m.role, content: m.content }))
      const reply = await chatCompletion(systemPrompt, apiHistory, apiKey)

      const sp = extractSpecialty(reply)
      const clean = stripTag(reply)
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: clean }

      setMsgs(prev => [...prev, assistantMsg])

      if (sp && !specialty) {
        setSpecialty(sp)
        setLocStep('gov')
      }
    } catch (err) {
      setMsgs(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ حدث خطأ: ${err.message}`,
      }])
    } finally {
      setBusy(false)
    }
  }, [apiKey, input, msgs, mode, specialty])

  // ── Location submit ────────────────────────────────────────────

  const submitGov = useCallback(() => {
    if (!gov) return
    setLocStep('area')
  }, [gov])

  const submitArea = useCallback(() => {
    setLocStep('done')
    const found = findProviders(specialty, gov, area, allRows)

    const locationLabel = [gov, area].filter(Boolean).join('، ')
    const summary = found.length > 0
      ? `وجدت ${found.length} مقدم خدمة في ${locationLabel}. إليك أفضل الخيارات المتاحة:`
      : `لم أجد مقدمي خدمة متخصصين في "${specialty}" في ${locationLabel}.\nيمكنك توسيع البحث أو التواصل مع Nextcare مباشرة على 19154.`

    setMsgs(prev => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: summary,
      providers: found,
    }])
  }, [specialty, gov, area, allRows])

  // ── Approval form submit ───────────────────────────────────────

  const submitForm = useCallback(() => {
    const f = formData
    const hasData = Object.values(f).some(v => v.trim())
    if (!hasData) return
    setApprovalStep('result')
    setMsgs(prev => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: '✅ تم تجهيز بيانات طلب الموافقة. اضغط على الزر أدناه لإرسال الطلب مباشرة إلى Nextcare عبر واتساب.',
    }])
  }, [formData])

  // ── WhatsApp message ───────────────────────────────────────────

  const waLink = useCallback(() => {
    const f = formData
    const lines = [
      'السلام عليكم،',
      'أرغب في تقديم طلب موافقة طبية.',
      '',
      waNumber             ? `📱 رقم واتساب المريض: ${waNumber}` : '',
      f.patientName        ? `👤 اسم المريض: ${f.patientName}` : '',
      f.nationalId         ? `🪪 رقم الهوية: ${f.nationalId}` : '',
      f.insuranceNo        ? `🏥 رقم التأمين/العضوية: ${f.insuranceNo}` : '',
      f.policyNo           ? `📋 رقم الوثيقة/البوليصة: ${f.policyNo}` : '',
      f.employer           ? `🏢 الشركة/صاحب العمل: ${f.employer}` : '',
      '',
      f.doctorName         ? `👨‍⚕️ اسم الطبيب: ${f.doctorName}` : '',
      f.diagnosis          ? `🩺 التشخيص: ${f.diagnosis}` : '',
      f.prescription       ? `💊 الدواء/الإجراء المطلوب: ${f.prescription}` : '',
      '',
      'يرجى مراجعة الطلب والموافقة في أقرب وقت. شكراً.',
    ].filter(Boolean).join('\n')
    return `https://wa.me/${NEXTCARE_WA}?text=${encodeURIComponent(lines)}`
  }, [waNumber, formData])

  // ── Render ─────────────────────────────────────────────────────

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="المساعد الطبي الذكي"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-br from-sky-500 to-teal-600
          rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all
          flex items-center justify-center"
      >
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex flex-col"
      style={{ width: 'min(calc(100vw - 2rem), 26rem)', maxHeight: 'calc(100vh - 2rem)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="bg-gradient-to-l from-sky-500 to-teal-500 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">المساعد الطبي الذكي</p>
                <p className="text-sky-100 text-xs">مدعوم بـ {modelLabel()}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 bg-white/20 hover:bg-white/35 rounded-lg flex items-center justify-center text-white transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2">
            {[
              { key: 'symptom',  label: '🩺 استشارة طبية' },
              { key: 'approval', label: '📋 موافقة طبية' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => switchMode(tab.key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === tab.key
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Messages ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" dir="rtl">
          {msgs.map(msg => (
            <div key={msg.id}>
              <Bubble msg={msg} />
              {msg.providers?.length > 0 && (
                <div className="space-y-2 mt-2">
                  {msg.providers.map((row, i) => <ProviderCard key={i} row={row} />)}
                </div>
              )}
            </div>
          ))}

          {/* Location pickers (symptom flow) */}
          {mode === 'symptom' && locStep === 'gov' && (
            <LocationPicker
              label="📍 في أي محافظة تقع؟"
              options={govOptions}
              value={gov}
              onChange={setGov}
              onSubmit={submitGov}
              optional={false}
            />
          )}
          {mode === 'symptom' && locStep === 'area' && (
            <LocationPicker
              label="🗺️ حدد المنطقة أو المدينة (اختياري)"
              options={areaOptions}
              value={area}
              onChange={setArea}
              onSubmit={submitArea}
              optional
            />
          )}

          {/* Approval data form */}
          {mode === 'approval' && approvalStep === 'form' && (
            <ApprovalForm
              data={formData}
              waNumber={waNumber}
              onChange={(k, v) => setFormData(p => ({ ...p, [k]: v }))}
              onWaChange={setWaNumber}
              onSubmit={submitForm}
            />
          )}

          {/* WhatsApp send button (approval result) */}
          {mode === 'approval' && approvalStep === 'result' && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-right space-y-2">
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors w-full"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                إرسال طلب الموافقة عبر واتساب
              </a>
            </div>
          )}

          {busy && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ─────────────────────────────────────────── */}
        {locStep !== 'gov' && locStep !== 'area' && (
          <div className="border-t border-gray-100 p-3 shrink-0 space-y-2" dir="rtl">

            {/* Open approval form button */}
            {mode === 'approval' && approvalStep === 'chat' && (
              <button
                onClick={() => setApprovalStep('form')}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100
                  text-blue-600 text-xs font-semibold py-2 px-4 rounded-xl transition-colors border border-blue-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تعبئة نموذج طلب الموافقة
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="w-10 h-10 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white
                  rounded-xl flex items-center justify-center shrink-0 transition-colors"
                title="إرسال"
              >
                <svg className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={mode === 'symptom' ? 'صف أعراضك هنا...' : 'اكتب رسالتك...'}
                disabled={busy}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60 text-right"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
