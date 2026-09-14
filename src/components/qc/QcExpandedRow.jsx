import PriorityBadge from '../ui/PriorityBadge'
import StatusBadge from '../ui/StatusBadge'
import { formatQuantity } from '../table/sharedColumns'
import { formatDate } from '../../utils/formatters'
import { isInwardRow } from '../../utils/qcFilters'
import QcTypeBadge from './QcTypeBadge'

function Field({ label, wide = false, children }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-0.5 text-sm font-medium text-slate-800">
        {children}
      </div>
    </div>
  )
}

const orDash = (value) => value || '—'

const formatDays = (value) =>
  value === null || value === undefined ? '—' : `${value} days`

function formatWoItem(row) {
  if (!row.wo_item_code) return '—'
  if (!row.wo_item_desc || row.wo_item_desc === row.wo_item_code) {
    return row.wo_item_code
  }
  return `${row.wo_item_code} · ${row.wo_item_desc}`
}

export default function QcExpandedRow({ row }) {
  const isInward = isInwardRow(row)

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
      <div className="grid grid-cols-4 gap-x-8 gap-y-4">
        <Field label="QC Type">
          <QcTypeBadge type={row.qc_type} />
        </Field>
        <Field label="WO ID">
          <span className="font-mono text-orange-600">
            {orDash(row.wo_id)}
          </span>
        </Field>
        <Field label="Item Code">
          {orDash(row.item_code || row.item_no)}
        </Field>
        <Field label="Item Desc">{orDash(row.item_desc)}</Field>

        {isInward ? (
          <>
            <Field label="GRN No">{orDash(row.grn_no)}</Field>
            <Field label="GRN Date">{formatDate(row.grn_date)}</Field>
            <Field label="Invoice No">{orDash(row.invoice_no)}</Field>
            <Field label="Supplier">{orDash(row.supplier_name)}</Field>
            <Field label="GRN Qty">{formatQuantity(row.grn_qty)}</Field>
            <Field label="QC Ageing">{formatDays(row.qc_ageing_days)}</Field>
            <Field label="Material Issue">{orDash(row.qc_status)}</Field>
            <Field label="Required / Issued / Pending">
              {row.wo_id
                ? [row.required_qty, row.issued_qty, row.pending_issue_qty]
                    .map(formatQuantity)
                    .join(' / ')
                : '—'}
            </Field>
            <Field label="WO Item">{formatWoItem(row)}</Field>
            <Field label="WO Current Dept">{orDash(row.current_dept)}</Field>
          </>
        ) : (
          <>
            <Field label="Current Dept">{orDash(row.current_dept)}</Field>
            <Field label="Next Dept">{orDash(row.next_dept)}</Field>
            <Field label="Dept In Date">{formatDate(row.qc_in_date)}</Field>
            <Field label="QC Ageing">{formatDays(row.qc_ageing_days)}</Field>
            <Field label="Prod Sequence" wide>
              {orDash(row.op_seq_prod)}
            </Field>
            <Field label="QC Sequence" wide>
              {orDash(row.op_seq_qc)}
            </Field>
          </>
        )}

        <Field label="WO Qty">{formatQuantity(row.planned_qty)}</Field>
        <Field label="WO Start Dt">{formatDate(row.wo_start_date)}</Field>
        <Field label="WO Due Dt">{formatDate(row.wo_target_date)}</Field>
        <Field label="Priority">
          {row.priority ? <PriorityBadge priority={row.priority} /> : '—'}
        </Field>
        <Field label="WO Status">
          {row.status ? <StatusBadge status={row.status} /> : '—'}
        </Field>
        <Field label="Active Flag">
          {row.has_active_flag ? 'Yes' : 'No'}
        </Field>
      </div>
    </div>
  )
}
