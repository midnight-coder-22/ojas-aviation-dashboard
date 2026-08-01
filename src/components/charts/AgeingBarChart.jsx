import { useMemo } from 'react'

import StandardSingleBarChart from './StandardSingleBarChart'
import {
  AGEING_BANDS,
  getAgeingBand,
} from '../../utils/dashboardFilters'

const BAND_COLORS = {
  '0-7': '#22C55E',
  '8-14': '#84CC16',
  '15-30': '#F59E0B',
  '30+': '#EF4444',
}

export default function AgeingBarChart({
  workOrders = [],
  activeBand = null,
  onBandClick,
}) {
  const data = useMemo(() => {
    const counts = Object.fromEntries(
      AGEING_BANDS.map((band) => [band.key, 0]),
    )

    for (const row of workOrders) {
      const band = getAgeingBand(row)
      if (band && Object.hasOwn(counts, band)) counts[band] += 1
    }

    return AGEING_BANDS.map((band) => ({
      name: band.label,
      value: counts[band.key],
      color: BAND_COLORS[band.key],
    }))
  }, [workOrders])

  return (
    <StandardSingleBarChart
      data={data}
      emptyMessage="No ageing data available"
      yAxisLabel="WO count"
      activeValue={activeBand}
      onCategoryClick={onBandClick}
    />
  )
}
