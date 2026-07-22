const SHEETS = [
  {
    key: 'wos',
    label: 'Work Order Summary Report',
  },
  {
    key: 'ows',
    label: 'Operation Wise WIP Status',
  },
]

export default function SheetSelector({
  activeSheet,
  onChange,
  dirtySheets = {},
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SHEETS.map(({ key, label }) => {
        const isActive = activeSheet === key
        const isDirty = Boolean(dirtySheets[key])

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-orange-500 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50'
            }`}
          >
            <span>{label}</span>

            {isDirty && (
              <span
                className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 ${
                  isActive
                    ? 'border-white bg-amber-200'
                    : 'border-white bg-orange-500'
                }`}
                title="Unsaved changes"
                aria-label="Unsaved changes"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
