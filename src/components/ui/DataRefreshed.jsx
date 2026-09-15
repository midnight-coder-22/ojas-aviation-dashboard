import { useEffect, useState } from 'react'

import { formatRelative } from '../../utils/formatters'

/*
 * "Data refreshed 2 hours ago" for the latest pipeline run. Re-renders every
 * minute so dashboards left open on a wall screen stay accurate.
 */
export default function DataRefreshed({ timestamp }) {
  const [, setMinuteTick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(
      () => setMinuteTick((tick) => tick + 1),
      60_000,
    )
    return () => window.clearInterval(timer)
  }, [])

  if (!timestamp) return null

  const refreshedAt = new Date(timestamp)

  return (
    <span
      className="text-xs text-slate-400"
      title={
        Number.isNaN(refreshedAt.getTime())
          ? undefined
          : refreshedAt.toLocaleString()
      }
    >
      Data refreshed {formatRelative(timestamp)}
    </span>
  )
}
