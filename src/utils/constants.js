export const DEPARTMENTS = [
  'CNC',
  'VMC',
  'CONVENTIONAL',
  'SHEET METAL',
  'PRODUCTION',
  'EDM',
]

export const QC_DEPARTMENT = 'QC'

// Google Sheets edited on the Edit Data page (keys match the API's
// SHEET_CONFIG). Only the required ones must be committed before Post Data.
export const EDIT_SHEETS = [
  { key: 'wos', group: 'Production', label: 'Work Order Summary Report', shortLabel: 'WOS', required: true },
  { key: 'ows', group: 'Production', label: 'Operation Wise WIP Status', shortLabel: 'OWS', required: true },
  { key: 'grn_qc', group: 'Quality', label: 'Pending Purchase GRN QC', shortLabel: 'GRN QC', required: false },
  { key: 'vendor_inward', group: 'Quality', label: 'Vendor Outsource Inward', shortLabel: 'Vendor Inward', required: false },
  { key: 'pdi', group: 'Quality', label: 'PDI Summary', shortLabel: 'PDI', required: false },
  { key: 'wo_mi', group: 'Stores', label: 'Work Order vs Material Issue', shortLabel: 'WO MI', required: false },
  { key: 'material_issue', group: 'Stores', label: 'Material Issue List', shortLabel: 'Material Issue', required: false },
  { key: 'po_grn', group: 'Stores', label: 'PO vs GRN', shortLabel: 'PO vs GRN', required: false },
  { key: 'material_return', group: 'Stores', label: 'Shop Floor Material Return', shortLabel: 'Material Return', required: false },
  { key: 'issue_vs_return', group: 'Stores', label: 'Issue vs Return', shortLabel: 'Issue vs Return', required: false },
  { key: 'cust_po_wo', group: 'Sales', label: 'Pending Customer PO vs WO', shortLabel: 'Cust PO vs WO', required: false },
]

// "SHEET METAL" -> "sheet-metal" (for URLs)
export const deptToSlug = (dept) =>
  dept.toLowerCase().replace(/ /g, '-')

// "sheet-metal" -> "SHEET METAL" (from URL back to API name)
export const slugToDept = (slug) =>
  slug.toUpperCase().replace(/-/g, ' ')

export const WO_AGEING_WARNING = 14
export const WO_AGEING_DANGER = 30
export const DEPT_AGEING_WARNING = 7
export const DEPT_AGEING_DANGER = 14

export const STATUS_DISPLAY = {
  New: 'New',
  Ongoing: 'Ongoing',
  Delayed: 'Delayed',
  Overdue: 'Overdue',
  Completed: 'Completed',

  // Temporary compatibility while backend/frontend deployments overlap.
  InProcess: 'Ongoing',
  'In Process': 'Ongoing',
  InProgress: 'Ongoing',
  'In Progress': 'Ongoing',
  NotStarted: 'New',
  'Not Started': 'New',
}

export const STATUS_COLORS = {
  New: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  Ongoing: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  Delayed: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
  },
  Overdue: {
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
  Completed: {
    bg: 'bg-green-100',
    text: 'text-green-700',
  },

  // Temporary compatibility.
  InProcess: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  'In Process': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  InProgress: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  'In Progress': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  NotStarted: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  'Not Started': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
}

export const PRIORITY_COLORS = {
  Low: { bg: 'bg-green-100', text: 'text-green-700' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  High: { bg: 'bg-red-100', text: 'text-red-700' },
}

export const CHART_COLORS = {
  status: {
    New: '#3B82F6',
    Ongoing: '#F59E0B',
    Delayed: '#F97316',
    Overdue: '#DC2626',
    Completed: '#22C55E',

    // Temporary compatibility.
    InProcess: '#F59E0B',
    InProgress: '#F59E0B',
  },
  priority: {
    Low: '#22C55E',
    Medium: '#F59E0B',
    High: '#EF4444',
  },
  // Flagged reuses the app's existing "danger" red (flag badges, overdue
  // rows); unflagged reuses the existing neutral gray (priority/status
  // bars use the same slate-400) - not a fresh categorical pick, so it
  // stays consistent with how flags already read everywhere else in the app.
  flagStatus: {
    flagged: '#EF4444',
    unflagged: '#94A3B8',
  },
}

// One color per department for the Executive KPI-4 trend lines. Fixed
// assignment (never cycled/reordered) from the dataviz skill's validated
// 6-slot categorical order - re-run scripts/validate_palette.js before
// changing any of these.
export const DEPARTMENT_COLORS = {
  CNC: '#2a78d6',
  VMC: '#eb6834',
  CONVENTIONAL: '#1baf7a',
  'SHEET METAL': '#eda100',
  PRODUCTION: '#e87ba4',
  EDM: '#008300',
}

export const STORAGE_AUTH = 'ojas_auth'
export const STORAGE_TOKEN = 'ojas_token'
