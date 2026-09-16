import { useMemo, useState } from 'react'
import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react'

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

/* SO/GRN reference number, item number, and the customer/supplier name shown beside it. */
function matchesSearch(row, query) {
  if (!query) return true
  return [row.reference_no, row.item_no, row.description].some((value) =>
    normalizeText(value).includes(query),
  )
}

/*
 * KPI 0.5: pending customer SO lines + pending GRNs, unioned into one
 * lightweight table. Not a reuse of WorkOrderTable - these rows are SO
 * lines and GRNs, not work orders, and don't need its flag/fullscreen
 * machinery. Internally scrollable rather than paginated, since this is a
 * simple 3-column watchlist, not a full data grid.
 */
export default function PendingWatchlistTable({ rows = [] }) {
  const [sortDir, setSortDir] = useState('desc')
  const [searchText, setSearchText] = useState('')

  const sorted = useMemo(() => {
    const safeRows = Array.isArray(rows) ? rows : []
    return [...safeRows].sort((a, b) => {
      const left = a.ageing_days ?? -1
      const right = b.ageing_days ?? -1
      return sortDir === 'desc' ? right - left : left - right
    })
  }, [rows, sortDir])

  const query = normalizeText(searchText)
  const filtered = useMemo(
    () => sorted.filter((row) => matchesSearch(row, query)),
    [sorted, query],
  )

  if (sorted.length === 0) {
    return (
      <div className="flex h-full min-h-[175px] items-center justify-center px-4 text-center text-sm text-slate-400">
        Nothing pending - no open SO lines or GRNs right now.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <label className="relative mb-1.5 shrink-0">
        <Search
          size={12}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search SO/GRN no, item, customer..."
          aria-label="Search pending watchlist"
          className="h-7 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[11px] text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-xs text-slate-400">
          No rows match "{searchText.trim()}".
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-100">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-2 py-1.5 text-left">SO Line No / GRN No</th>
              <th className="px-2 py-1.5 text-left">Material Avail.</th>
              <th className="px-2 py-1.5 text-right">
                <button
                  type="button"
                  onClick={() => setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'))}
                  className="inline-flex items-center gap-0.5 uppercase tracking-wide hover:text-slate-800"
                >
                  Ageing
                  {sortDir === 'desc' ? <ArrowDownAZ size={10} /> : <ArrowUpAZ size={10} />}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr
                key={`${row.kind}-${row.reference_no}-${row.item_no}-${index}`}
                className="border-b border-slate-50 hover:bg-slate-50"
              >
                <td className="px-2 py-1.5">
                  <span
                    className={`mr-1.5 inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold ${
                      row.kind === 'SO' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {row.kind}
                  </span>
                  <span className="font-medium text-slate-700">{row.reference_no || '—'}</span>
                  {row.description && (
                    <span className="ml-1.5 text-slate-400">· {row.description}</span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {row.material_available === null || row.material_available === undefined ? (
                    <span className="text-slate-300">—</span>
                  ) : row.material_available ? (
                    <span className="font-semibold text-green-600">Yes</span>
                  ) : (
                    <span className="font-semibold text-red-500">No</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right text-slate-600">
                  {row.ageing_days === null || row.ageing_days === undefined ? '—' : `${row.ageing_days}d`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
