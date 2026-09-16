import StandardSingleBarChart from '../charts/StandardSingleBarChart'
import { buildMiPendingAgeingData } from '../../utils/executiveFilters'

/*
 * KPI 2: WOs with material issue still pending (rpt_wo_mi Issue Status
 * PENDING/PARTIAL), bucketed by ageing since the WO's own start date. The
 * department filter narrows the WO list before bucketing - there's no
 * per-department bar here to dim instead.
 */
export default function MiPendingAgeingChart({ rows, filters }) {
  const data = buildMiPendingAgeingData(rows, filters)

  return (
    <StandardSingleBarChart
      data={data}
      emptyMessage="No work orders are currently waiting on a material issue."
      yAxisLabel="WO count"
    />
  )
}
