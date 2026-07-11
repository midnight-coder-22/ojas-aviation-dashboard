import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, LabelList, ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS, STATUS_DISPLAY } from '../../utils/constants'

export default function StatusBarChart({ statusBreakdown = {} }) {
  const data = Object.entries(statusBreakdown).map(([status, count]) => ({
    name:  STATUS_DISPLAY[status] || status,
    count,
    color: CHART_COLORS.status[status] || '#94A3B8',
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={48}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
          cursor={{ fill: '#F8FAFC' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}