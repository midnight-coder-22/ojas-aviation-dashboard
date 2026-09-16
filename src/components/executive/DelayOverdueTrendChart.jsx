import TrendCard from './TrendCard'
import StandardLineChart from '../charts/StandardLineChart'
import { DEPARTMENT_COLORS, DEPARTMENTS } from '../../utils/constants'
import { buildDelayOverdueTrendSeries, formatSnapshotDateLabel, shiftFinancialYear } from '../../utils/executiveFilters'

const DEPARTMENT_SERIES = DEPARTMENTS.map((department) => ({
  key: department,
  label: department,
  color: DEPARTMENT_COLORS[department],
}))

/*
 * KPI 4: Delayed+Overdue WO count per department, over time. One point per
 * day this was captured - not continuous - since the snapshot only advances
 * once a day, at most, per the pickup rule (see routers/executive.py).
 * Clicking a department card highlights that department's line instead of
 * hiding the other five.
 */
export default function DelayOverdueTrendChart({ points = [], financialYear, onChangeFinancialYear, activeDepartment }) {
  const series = buildDelayOverdueTrendSeries(points).map((row) => ({
    ...row,
    x: formatSnapshotDateLabel(row.date),
  }))
  const latest = series[series.length - 1]
  const latestTotal = latest
    ? DEPARTMENTS.reduce((sum, department) => sum + (Number(latest[department]) || 0), 0)
    : null

  return (
    <TrendCard
      title="Delayed + Overdue Trend"
      subtitle="One line per department, sampled once data is refreshed each day"
      metricValue={latestTotal}
      metricLabel="Latest total"
      financialYear={financialYear}
      onShiftFinancialYear={(delta) => onChangeFinancialYear(shiftFinancialYear(financialYear, delta))}
      legend={DEPARTMENT_SERIES}
    >
      <StandardLineChart
        data={series}
        xKey="x"
        series={DEPARTMENT_SERIES}
        yAxisLabel="Delayed + Overdue"
        activeSeriesKey={activeDepartment}
        emptyMessage="No trend points yet - this starts building from today."
      />
    </TrendCard>
  )
}
