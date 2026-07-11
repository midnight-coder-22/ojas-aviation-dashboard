export const DEPARTMENTS = [
  "CNC", "VMC", "CONVENTIONAL", "SHEET METAL", "PRODUCTION", "EDM"
]

// "SHEET METAL" → "sheet-metal" (for URLs)
export const deptToSlug = (dept) =>
  dept.toLowerCase().replace(/ /g, '-')

// "sheet-metal" → "SHEET METAL" (from URL back to API name)
export const slugToDept = (slug) =>
  slug.toUpperCase().replace(/-/g, ' ')

export const WO_AGEING_WARNING   = 14
export const WO_AGEING_DANGER    = 30
export const DEPT_AGEING_WARNING = 7
export const DEPT_AGEING_DANGER  = 14

export const STATUS_DISPLAY = {
  New:       'Not Started',
  InProcess: 'In Process',
  Completed: 'Completed',
}

export const STATUS_COLORS = {
  New:       { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  InProcess: { bg: 'bg-orange-100', text: 'text-orange-700' },
  Completed: { bg: 'bg-green-100',  text: 'text-green-700'  },
}

export const PRIORITY_COLORS = {
  Low:    { bg: 'bg-green-100', text: 'text-green-700' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  High:   { bg: 'bg-red-100',   text: 'text-red-700'   },
}

export const CHART_COLORS = {
  status: {
    New:       '#3B82F6',
    InProcess: '#F97316',
    Completed: '#22C55E',
  },
  priority: {
    Low:    '#22C55E',
    Medium: '#F59E0B',
    High:   '#EF4444',
  },
}

export const STORAGE_AUTH  = 'ojas_auth'
export const STORAGE_TOKEN = 'ojas_token'