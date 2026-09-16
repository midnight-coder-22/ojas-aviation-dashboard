/* Filler for a bento-grid cell with no KPI assigned yet. */
export default function KpiPlaceholder({ label = 'KPI' }) {
  return (
    <div className="flex h-[290px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-300">
      {label}
    </div>
  )
}
