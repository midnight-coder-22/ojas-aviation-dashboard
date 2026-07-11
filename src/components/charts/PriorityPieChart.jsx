// src/components/charts/PriorityPieChart.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS } from '../../utils/constants'

export default function PriorityPieChart({ priorityBreakdown = {} }) {
  const total = Object.values(priorityBreakdown).reduce((s, v) => s + v, 0)

  const data = Object.entries(priorityBreakdown).map(([priority, count]) => ({
    name:  priority,
    value: count,
    color: CHART_COLORS.priority[priority] || '#94A3B8',
    pct:   total > 0 ? ((count / total) * 100).toFixed(0) : 0,
  }))

  return (
    <div className="flex items-center gap-6">
      {/* Full pie — no innerRadius */}
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}   // ← FULL pie, not donut
            outerRadius={82}
            dataKey="value"
            strokeWidth={2}
            stroke="#fff"
          >
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend — right side, vertical */}
      <div className="flex flex-col gap-3">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-600">{entry.name}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="font-semibold text-slate-800">{entry.value}</span>
              <span className="text-slate-400">{entry.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}