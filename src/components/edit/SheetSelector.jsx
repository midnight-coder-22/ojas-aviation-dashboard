export default function SheetSelector({ activeSheet, onChange }) {
  return (
    <div className="flex gap-2">
      {[
        { key: 'wos', label: 'Work Order Summary Report' },
        { key: 'ows', label: 'Operation Wise WIP Status' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSheet === key
              ? 'bg-orange-500 text-white'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}