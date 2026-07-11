import { useMemo } from 'react'

export default function SpreadsheetGrid({
  headers     = [],
  rows        = [],
  editedRows  = [],
  onCellChange,
  searchText  = '',
}) {
  const filtered = useMemo(() => {
    if (!searchText) return editedRows.map((r, i) => ({ row: r, origIdx: i }))
    const q = searchText.toLowerCase()
    return editedRows
      .map((r, i) => ({ row: r, origIdx: i }))
      .filter(({ row }) => row.some(cell => String(cell ?? '').toLowerCase().includes(q)))
  }, [editedRows, searchText])

  return (
    <div className="border border-slate-200 rounded-xl overflow-auto max-h-[calc(100vh-280px)]">
      <table className="w-full border-collapse text-sm">
        {/* Header */}
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            <th className="w-10 px-2 py-2 text-xs text-slate-400 font-normal border-b border-r border-slate-200 bg-slate-100 text-center">
              #
            </th>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide
                           text-slate-500 border-b border-r border-slate-200 whitespace-nowrap min-w-32"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {filtered.map(({ row, origIdx }, displayIdx) => (
            <tr key={origIdx} className={displayIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {/* Row number */}
              <td className="px-2 py-1 text-xs text-slate-400 text-center border-r border-slate-100 bg-slate-50 select-none">
                {origIdx + 1}
              </td>
              {headers.map((_, colIdx) => {
                const cellValue    = row[colIdx] ?? ''
                const originalVal  = rows[origIdx]?.[colIdx] ?? ''
                const isEdited     = String(cellValue) !== String(originalVal)
                const isFirstCol   = colIdx === 0

                return (
                  <td
                    key={colIdx}
                    className={`border-r border-b border-slate-100 p-0
                      ${isEdited ? 'bg-orange-50' : ''}
                      ${isFirstCol ? 'bg-slate-50' : ''}
                    `}
                  >
                    <input
                      type="text"
                      value={cellValue}
                      readOnly={isFirstCol}
                      onChange={e => onCellChange(origIdx, colIdx, e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-sm border-0 bg-transparent
                        focus:outline-none focus:ring-1 focus:ring-orange-300 focus:bg-orange-50
                        rounded-sm min-w-24
                        ${isFirstCol ? 'cursor-not-allowed text-slate-400' : 'text-slate-700'}
                      `}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}