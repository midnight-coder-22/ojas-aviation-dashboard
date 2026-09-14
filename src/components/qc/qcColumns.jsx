import PriorityBadge from '../ui/PriorityBadge'
import StatusBadge from '../ui/StatusBadge'
import QcTypeBadge from './QcTypeBadge'
import {
  FLAGS_COLUMN,
  formatQuantity,
  getAgeingTextClass,
  renderDeptChip,
  renderTruncated,
} from '../table/sharedColumns'
import {
  formatAgeingCompact,
  formatDate,
} from '../../utils/formatters'
import {
  ISSUE_STATUS_BADGE_CLASSES,
  isInwardRow,
} from '../../utils/qcFilters'

const DASH = <span className="text-sm text-slate-300">—</span>

function renderQcStatus(row) {
  if (!isInwardRow(row)) {
    return row.status ? <StatusBadge status={row.status} /> : DASH
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ISSUE_STATUS_BADGE_CLASSES[row.issue_status] ??
        'bg-slate-100 text-slate-600'
      }`}
    >
      {row.qc_status}
    </span>
  )
}

/* Rows must first pass through prepareQcRows (adds source_name, qc_qty, qc_status). */
export const QC_TABLE_COLUMNS = [
  {
    key: 'qc_type',
    label: 'QC Type',
    sortType: 'text',
    className: 'px-2 py-3 2xl:px-3',
    render: (row) => <QcTypeBadge type={row.qc_type} />,
  },
  {
    key: 'wo_id',
    label: 'WO ID',
    sortType: 'text',
    className: 'px-2 py-3 2xl:px-3',
    render: (row) =>
      row.wo_id ? (
        <span className="text-xs font-bold tracking-wide text-slate-800">
          {row.wo_id}
        </span>
      ) : (
        DASH
      ),
  },
  {
    key: 'item_code',
    label: 'Item Code',
    sortType: 'text',
    className:
      'whitespace-nowrap px-2 py-3 2xl:px-3 text-sm font-medium text-slate-700',
    render: (row) =>
      renderTruncated(
        row.item_code || row.item_no,
        'max-w-[8rem] 2xl:max-w-none',
      ),
  },
  {
    key: 'source_name',
    label: 'From',
    sortType: 'text',
    className: 'px-2 py-3 2xl:px-3',
    render: (row) =>
      isInwardRow(row)
        ? renderTruncated(
            row.supplier_name,
            'max-w-[8rem] text-sm text-slate-700 2xl:max-w-[14rem]',
          )
        : renderDeptChip(row.source_dept),
  },
  {
    key: 'grn_no',
    label: 'GRN No',
    sortType: 'text',
    className: 'whitespace-nowrap px-2 py-3 2xl:px-3 text-sm text-slate-600',
    render: (row) => row.grn_no || DASH,
  },
  {
    key: 'qc_in_date',
    label: 'In Date',
    sortType: 'date',
    className: 'whitespace-nowrap px-2 py-3 2xl:px-3 text-sm text-slate-600',
    render: (row) => formatDate(row.qc_in_date),
  },
  {
    key: 'qc_ageing_days',
    label: 'QC Ageing',
    sortType: 'number',
    className: 'whitespace-nowrap px-2 py-3 2xl:px-3',
    render: (row) => (
      <span
        className={`text-sm font-semibold ${getAgeingTextClass(
          row.qc_ageing_days,
          3,
          7,
        )}`}
      >
        {formatAgeingCompact(row.qc_ageing_days)}
      </span>
    ),
  },
  {
    key: 'wo_target_date',
    label: 'WO Due Dt',
    sortType: 'date',
    className: 'whitespace-nowrap px-2 py-3 2xl:px-3 text-sm text-slate-600',
    render: (row) => formatDate(row.wo_target_date),
  },
  {
    key: 'qc_qty',
    label: 'Qty',
    sortType: 'number',
    align: 'right',
    className: 'px-2 py-3 2xl:px-3 text-right text-sm text-slate-700',
    render: (row) => formatQuantity(row.qc_qty),
  },
  {
    key: 'next_dept',
    label: 'Next Dept',
    sortType: 'text',
    className: 'px-2 py-3 2xl:px-3',
    render: (row) => renderDeptChip(row.next_dept),
  },
  {
    key: 'priority',
    label: 'Priority',
    sortType: 'text',
    className: 'px-2 py-3 2xl:px-3',
    render: (row) =>
      row.priority ? <PriorityBadge priority={row.priority} /> : DASH,
  },
  {
    key: 'qc_status',
    label: 'Status',
    sortType: 'text',
    className: 'px-2 py-3 2xl:px-3',
    render: renderQcStatus,
  },
  FLAGS_COLUMN,
]
