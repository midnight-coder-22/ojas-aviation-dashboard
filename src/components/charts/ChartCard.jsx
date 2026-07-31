import {
  PRIORITY_SERIES,
} from '../../utils/priorityChart'

export default function ChartCard({
  title,
  subtitle,
  metricValue,
  metricLabel,
  showPriorityLegend = false,
  children,
}) {
  const showMetric =
    metricValue !== null &&
    metricValue !== undefined

  return (
    <div className="flex h-[290px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
            Chart
          </p>

          <p className="mt-1 text-sm font-semibold leading-tight text-slate-800">
            {title}
          </p>

          {subtitle && (
            <p className="mt-1 truncate text-[10px] text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {showMetric && (
          <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
            <p className="text-lg font-bold leading-none text-slate-900">
              {metricValue}
            </p>

            <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
              {metricLabel}
            </p>
          </div>
        )}
      </div>

      {showPriorityLegend && (
        <div className="mb-1 mt-1 flex shrink-0 flex-wrap justify-end gap-2">
          {PRIORITY_SERIES.map(
            (series) => (
              <span
                key={series.key}
                className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500"
              >
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{
                    backgroundColor:
                      series.color,
                  }}
                />

                {series.label}
              </span>
            ),
          )}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {children}
      </div>
    </div>
  )
}