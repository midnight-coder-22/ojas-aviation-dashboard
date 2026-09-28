import { Truck } from 'lucide-react'
import { VENDOR_FILTER } from '../../utils/dashboardFilters'

const OPTIONS = [
  { value: null, label: 'All' },
  { value: VENDOR_FILTER.VENDOR, label: 'Vendor' },
  { value: VENDOR_FILTER.IN_HOUSE, label: 'In-house' },
]

/*
 * All / Vendor / In-house toggle. "Vendor" = WOs whose material went to a
 * job-work vendor since the WO started (F7 report); counts are optional.
 */
export default function VendorFilter({ value = null, onChange, counts }) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by vendor involvement"
      title="Vendor: the WO's material went to a job-work vendor (57F4 inward report)"
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      <Truck size={13} className="ml-1.5 mr-0.5 text-slate-400" aria-hidden="true" />
      {OPTIONS.map((option) => {
        const isActive = (value ?? null) === option.value
        const count = counts?.[option.value ?? 'all']

        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors
              ${isActive
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-800'}`}
          >
            {option.label}
            {Number.isFinite(count) && (
              <span className={`ml-1 tabular-nums ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
