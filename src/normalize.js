// Normalize Arabic waw (و) from standalone to prefix form:
// "طب و جراحة" → "طب وجراحة"
const normalizeWaw = (s) => s.replace(/ و /g, ' و').replace(/\s+/g, ' ').trim()

// ── Specialty normalization ───────────────────────────────────────────────────

// After waw-normalization, any specialty that starts with this prefix
// is collapsed to the canonical form.
const SPECIALTY_PREFIX_RULES = [
  {
    prefix:    'طب وجراحة الفم والأسنان',
    canonical: 'طب وجراحة الفم والأسنان',
  },
]

// Exact-match overrides (checked after waw-normalization).
// Add future one-off variants here.
const SPECIALTY_ALIASES = {
  // e.g. 'some odd spelling': 'canonical name',
}

export function normalizeSpecialty(val) {
  if (!val) return val
  const s = normalizeWaw(val)
  if (SPECIALTY_ALIASES[s]) return SPECIALTY_ALIASES[s]
  for (const { prefix, canonical } of SPECIALTY_PREFIX_RULES) {
    if (s === canonical || s.startsWith(prefix)) return canonical
  }
  return s
}

// ── Area normalization ────────────────────────────────────────────────────────

// Map variant spellings to a single canonical area name.
// Add future aliases here.
const AREA_ALIASES = {
  'حدائق الاهرام': 'حدائق الأهرام',
}

export function normalizeArea(val) {
  if (!val) return val
  return AREA_ALIASES[val] ?? val
}
