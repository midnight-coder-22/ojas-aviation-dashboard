import {
  ageingColor,
  formatDate,
} from '../../utils/formatters'
import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'

const Field = ({ label, children }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-0.5 text-sm font-medium text-slate-800">
      {children}
    </p>
  </div>
)

export default function ExpandedRow({ row }) {
  return (
    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
      <div className="grid grid-cols-4 gap-x-8 gap-y-4">
        <Field label="WO ID">
          <span className="font-mono text-orange-600">
            {row.wo_id || '—'}
          </span>
        </Field>

        <Field label="Item Code">{row.item_code || '—'}</Field>
        <Field label="Status">
          <StatusBadge status={row.status} />
        </Field>

        <Field label="Priority">
          <PriorityBadge priority={row.priority} />
        </Field>
        <Field label="Dept In Date">
          {formatDate(row.dept_in_date)}
        </Field>
        <Field label="WO Due Dt">
          {formatDate(row.wo_target_date)}
        </Field>
        <Field label="Dept Due Dt">
          {formatDate(row.dept_target_date)}
        </Field>

        <Field label="WO Ageing">
          <span className={ageingColor(row.wo_ageing_days, 'wo')}>
            {row.wo_ageing_days ?? '—'} days
          </span>
        </Field>
        <Field label="Dept Ageing">
          <span className={ageingColor(row.dept_ageing_days, 'dept')}>
            {row.dept_ageing_days ?? '—'} days
          </span>
        </Field>
        <Field label="Qty">{row.planned_qty ?? '—'}</Field>
        <Field label="Done / Expected">
          {row.done_steps ?? '—'} / {row.expected_steps ?? '—'}
        </Field>

        <Field label="Next Dept">
          {row.next_dept ? (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {row.next_dept}
            </span>
          ) : (
            '—'
          )}
        </Field>
        <Field label="QC Alert">{row.qc_alert ? 'Yes' : 'No'}</Field>
        <Field label="MI Alert">{row.mi_alert ? 'Yes' : 'No'}</Field>
        <Field label="Active Flag">
          {row.has_active_flag ? 'Yes' : 'No'}
        </Field>
      </div>
    </div>
  )
}
