import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Flag } from 'lucide-react'
import StatusBadge   from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import ExpandedRow   from './ExpandedRow'
import { formatDate }            from '../../utils/formatters'
import { formatAgeingCompact }   from '../../utils/formatters'
import { ageingColor }           from '../../utils/formatters'

const ROWS_OPTIONS = [10, 25, 50]
const SORTABLE     = ['wo_id','wo_name','status','priority','wo_ageing_days','dept_ageing_days','planned_qty']

// Small alert badge used inside the Alerts column
function AlertBadge({ type }) {
  const styles = {
    MI:  { bg: 'bg-orange-100 text-orange-700', label: 'MI'  },
    QC:  { bg: 'bg-blue-100 text-blue-700',     label: 'QC'  },
  }
  const s = styles[type]
  if (!s) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${s.bg}`}>
      {s.label}
    </span>
  )
}

export default function WorkOrderTable({
  data          = [],
  flagMode      = null,
  selectedWoIds = new Set(),
  onRowSelect   = () => {},
  searchText    = '',
}) {
  const [sortField, setSortField] = useState('wo_ageing_days')
  const [sortDir,   setSortDir]   = useState('desc')
  const [page,      setPage]      = useState(1)
  const [perPage,   setPerPage]   = useState(10)
  const [expanded,  setExpanded]  = useState(null)

  const handleSort = (field) => {
    if (!SORTABLE.includes(field)) return
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!searchText) return data
    const q = searchText.toLowerCase()
    return data.filter(r =>
      r.wo_id?.toLowerCase().includes(q) ||
      r.wo_name?.toLowerCase().includes(q)
    )
  }, [data, searchText])

  const sorted = useMemo(() => (
    [...filtered].sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  ), [filtered, sortField, sortDir])

  const totalPages = Math.ceil(sorted.length / perPage)
  const pageData   = sorted.slice((page - 1) * perPage, page * perPage)

  const handleRowClick = (row) => {
    if (flagMode === 'add') {
      if (row.has_active_flag) return
      onRowSelect(row.wo_id)
    } else if (flagMode === 'resolve') {
      if (!row.has_active_flag) return
      onRowSelect(row.wo_id)
    } else {
      setExpanded(prev => prev === row.wo_id ? null : row.wo_id)
    }
  }

  const getRowClass = (row) => {
    let base = 'border-b border-slate-100 cursor-pointer transition-colors '
    if (flagMode === 'add') {
      if (row.has_active_flag) return base + 'bg-amber-50 border-l-2 border-amber-400 cursor-not-allowed'
      if (selectedWoIds.has(row.wo_id)) return base + 'bg-orange-50 border-l-2 border-orange-400'
      return base + 'hover:bg-orange-50'
    }
    if (flagMode === 'resolve') {
      if (!row.has_active_flag) return base + 'opacity-30 cursor-not-allowed'
      return selectedWoIds.has(row.wo_id)
        ? base + 'bg-green-50 border-l-2 border-green-400'
        : base + 'bg-amber-50 border-l-2 border-amber-400'
    }
    if (row.has_active_flag) base += 'border-l-2 border-amber-400 '
    return base + 'hover:bg-slate-50'
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="inline ml-0.5 text-orange-500" />
      : <ChevronDown size={11} className="inline ml-0.5 text-orange-500" />
  }

  const TH = ({ field, children, className = '' }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500
        whitespace-nowrap select-none
        ${SORTABLE.includes(field) ? 'cursor-pointer hover:text-slate-800' : ''}
        ${className}`}
    >
      {children} <SortIcon field={field} />
    </th>
  )

  return (
    <div>
      {/* Alert legend above table */}
      <div className="flex items-center justify-end gap-3 mb-3 text-xs text-slate-500">
        {/* <span className="font-medium">Alerts:</span> */}
        {/* <span className="flex items-center gap-1 bg-orange-100 text-orange-700 rounded-md px-2 py-0.5 font-semibold">
          MI — Maint. Issue
        </span> */}
        {/* <span className="flex items-center gap-1 bg-blue-100 text-blue-700 rounded-md px-2 py-0.5 font-semibold">
          QC — Quality Check
        </span> */}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="border-b border-slate-200">
              <TH field="wo_id">WO ID</TH>
              <TH field="wo_name">WO Name</TH>
              <TH field="dept_in_date">In Date</TH>
              <TH field="wo_ageing_days">WO Ageing</TH>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                WO Target Date
              </th>
              <TH field="dept_ageing_days">Dept Ageing</TH>
              <TH field="planned_qty" className="text-right">Planned Qty</TH>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Next Department
              </th>
              <TH field="priority">Priority</TH>
              <TH field="status">Status</TH>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alerts
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row) => (
              <>
                <tr
                  key={row.wo_id}
                  onClick={() => handleRowClick(row)}
                  className={getRowClass(row)}
                >
                  {/* WO ID — bold black matching Figma */}
                  <td className="px-3 py-3">
                    <span className="font-bold text-slate-800 text-xs tracking-wide">
                      {row.wo_id}
                    </span>
                  </td>

                  {/* WO Name */}
                  <td className="px-3 py-3 max-w-44">
                    <span className="text-sm text-slate-700 truncate block" title={row.wo_name}>
                      {row.wo_name}
                    </span>
                  </td>

                  {/* In Date */}
                  <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(row.dept_in_date)}
                  </td>

                  {/* WO Ageing — compact "675d" */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      row.wo_ageing_days > 30
                        ? 'text-red-500'
                        : row.wo_ageing_days > 14
                          ? 'text-amber-500'
                          : 'text-slate-600'
                    }`}>
                      {formatAgeingCompact(row.wo_ageing_days)}
                    </span>
                  </td>

                  {/* WO Target Date — always "—" since not in our data */}
                  <td className="px-3 py-3 text-sm text-slate-400">—</td>

                  {/* Dept Ageing — compact */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      row.dept_ageing_days > 14
                        ? 'text-red-500'
                        : row.dept_ageing_days > 7
                          ? 'text-amber-500'
                          : row.dept_ageing_days !== null
                            ? 'text-slate-600'
                            : 'text-slate-400'
                    }`}>
                      {formatAgeingCompact(row.dept_ageing_days)}
                    </span>
                  </td>

                  {/* Planned Qty */}
                  <td className="px-3 py-3 text-sm text-slate-700 text-right">
                    {row.planned_qty?.toLocaleString()}
                  </td>

                  {/* Next Department */}
                  <td className="px-3 py-3">
                    {row.next_dept
                      ? (
                        <span className="bg-slate-100 text-slate-700 rounded-md px-2 py-1
                                         text-xs font-semibold uppercase tracking-wide">
                          {row.next_dept}
                        </span>
                      )
                      : <span className="text-slate-300">—</span>
                    }
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-3">
                    <PriorityBadge priority={row.priority} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <StatusBadge status={row.status} />
                  </td>

                  {/* Alerts — single column with MI/QC badges */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      {row.mi_alert && <AlertBadge type="MI" />}
                      {row.qc_alert && <AlertBadge type="QC" />}
                      {!row.mi_alert && !row.qc_alert && (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </div>
                  </td>

                  {/* Flags */}
                  <td className="px-3 py-3 text-center">
                    {row.has_active_flag
                      ? <Flag size={14} className="text-orange-500 inline fill-orange-200" />
                      : <span className="text-slate-300 text-sm">—</span>
                    }
                  </td>
                </tr>

                {/* Expanded row — only outside flag mode */}
                {!flagMode && expanded === row.wo_id && (
                  <tr key={`${row.wo_id}-exp`}>
                    <td colSpan={12} className="p-0">
                      <ExpandedRow row={row} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Rows per page:</span>
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
          >
            {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * perPage + 1, sorted.length)}–{Math.min(page * perPage, sorted.length)} of {sorted.length}
          </span>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs
                       disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs
                       disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}