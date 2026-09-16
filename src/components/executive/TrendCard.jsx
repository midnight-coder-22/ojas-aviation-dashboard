import { ChevronLeft, ChevronRight } from 'lucide-react'

function FinancialYearSelector({ financialYear, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 px-1 py-0.5">
      <button
        type="button"
        onClick={() => onChange(-1)}
        aria-label="Previous financial year"
        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <ChevronLeft size={13} />
      </button>
      <span className="px-1 text-[11px] font-semibold tabular-nums text-slate-600">FY {financialYear}</span>
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-label="Next financial year"
        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <ChevronRight size={13} />
      </button>
    </div>
  )
}

/*
 * Shared shell for KPI 3 / KPI 4: both are financial-year-scoped line
 * charts that need more legend room (up to 6 series) than the standard
 * 290px ChartCard, so they get their own taller card rather than
 * stretching that shared component to fit a case it wasn't built for.
 */
export default function TrendCard({
  title,
  subtitle,
  metricValue,
  metricLabel,
  financialYear,
  onShiftFinancialYear,
  legend,
  children,
}) {
  return (
    <div className="flex h-[340px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase leading-none tracking-wider text-slate-400">Chart</p>
          <p className="mt-1 text-sm font-semibold leading-tight text-slate-800">{title}</p>
          {subtitle && <p className="mt-1 truncate text-[10px] text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {metricValue !== null && metricValue !== undefined && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
              <p className="text-lg font-bold leading-none text-slate-900">{metricValue}</p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-slate-500">{metricLabel}</p>
            </div>
          )}
          <FinancialYearSelector financialYear={financialYear} onChange={onShiftFinancialYear} />
        </div>
      </div>

      {legend && (
        <div className="mb-1 mt-2 flex shrink-0 flex-wrap gap-x-3 gap-y-1">
          {legend.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
