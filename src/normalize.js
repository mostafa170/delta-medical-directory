// Collapse any whitespace around standalone Arabic waw (و) into prefix form:
// "طب و جراحة" → "طب وجراحة"
const normalizeWaw = (s) => s.replace(/\s+و\s+/g, ' و').replace(/\s+/g, ' ').trim()

// Normalize Alef variants to bare alef for fuzzy matching only.
// أ (U+0623) إ (U+0625) آ (U+0622) ٱ (U+0671) → ا (U+0627)
const normalizeAlef = (s) => s.replace(/[أإآٱ]/g, 'ا')

// Combined match-key: apply both normalizations.
// Used ONLY for comparison — never as the stored/displayed value.
const matchKey = (s) => normalizeAlef(normalizeWaw(s))

// ── Specialty normalization ───────────────────────────────────────────────────

// PREFIX_RULES: if matchKey(input) starts with matchKey(prefix), output canonical.
// prefix values should be written in their canonical (correct) form.
const SPECIALTY_PREFIX_RULES = [
  {
    prefix:    'طب وجراحة الفم والأسنان',
    canonical: 'طب وجراحة الفم والأسنان',
  },
]

// SPECIALTY_ALIASES: exact matchKey → canonical, for one-off variants.
const SPECIALTY_ALIASES = {
  // 'odd spelling after matchKey': 'canonical form',
}

export function normalizeSpecialty(val) {
  if (!val) return val
  const key = matchKey(val)
  if (SPECIALTY_ALIASES[key]) return SPECIALTY_ALIASES[key]
  for (const { prefix, canonical } of SPECIALTY_PREFIX_RULES) {
    if (key === matchKey(prefix) || key.startsWith(matchKey(prefix))) return canonical
  }
  // Fall back to just normalizing waw spacing (no alef change in output).
  return normalizeWaw(val)
}

// ── Area normalization ────────────────────────────────────────────────────────

// Exact-match aliases for area name variants.
// Add future aliases here.
const AREA_ALIASES = {
  'حدائق الاهرام': 'حدائق الأهرام',
}

export function normalizeArea(val) {
  if (!val) return val
  return AREA_ALIASES[val] ?? AREA_ALIASES[matchKey(val)] ?? val
}
