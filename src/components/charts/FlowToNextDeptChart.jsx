import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, LabelList, ResponsiveContainer,
} from 'recharts'

export default function FlowToNextDeptChart({ data = [] }) {
  // Group work orders by next_dept
  const counts = {}
  data.forEach(row => {
    if (!row.next_dept) return
    counts[row.next_dept] = (counts[row.next_dept] || 0) + 1
  })

  // Sort by count descending
  const chartData = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([dept, count]) => ({
      name:  dept.length > 8 ? dept.replace(' ', '\n') : dept,
      count,
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        No next department data
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={36}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
            cursor={{ fill: '#FFF7ED' }}
          />
          <Bar dataKey="count" radius={[5, 5, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
            />
            {chartData.map((_, i) => (
              <Cell key={i} fill="#F97316" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 text-center mt-1">
        Work orders by next department
      </p>
    </div>
  )
}