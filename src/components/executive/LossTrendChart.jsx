import TrendCard from './TrendCard'
import StandardLineChart from '../charts/StandardLineChart'
import { formatCompactINR, formatMonthLabel, shiftFinancialYear } from '../../utils/executiveFilters'

const LOSS_SERIES = [{ key: 'loss', label: 'Cumulative loss', color: '#DC2626' }]

/*
 * KPI 3: cumulative loss (0.05 x quoted line value) from customer SO/PO
 * lines that missed their DueDate while still unfulfilled - independent of
 * the WOS/OWS Overdue/Delayed rule used everywhere else (see root
 * CLAUDE.md). The very first activation seeds any already-breaching lines
 * as a silent baseline instead of backfilling years of history into day
 * one, so an empty chart at first is expected, not a bug.
 */
export default function LossTrendChart({ points = [], financialYear, onChangeFinancialYear }) {
  const data = points.map((point) => ({ x: formatMonthLabel(point.month), loss: point.cumulative_loss }))
  const totalLoss = points.length ? points[points.length - 1].cumulative_loss : 0

  return (
    <TrendCard
      title="Loss vs Time"
      subtitle="Cumulative loss from missed customer commitments"
      metricValue={formatCompactINR(totalLoss)}
      metricLabel={`FY ${financialYear} total`}
      financialYear={financialYear}
      onShiftFinancialYear={(delta) => onChangeFinancialYear(shiftFinancialYear(financialYear, delta))}
    >
      <StandardLineChart
        data={data}
        xKey="x"
        series={LOSS_SERIES}
        yAxisLabel="Cumulative loss"
        valueFormatter={formatCompactINR}
        emptyMessage="No commitment fails recorded yet this financial year."
      />
    </TrendCard>
  )
}
