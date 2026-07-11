import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, LabelList, ResponsiveContainer,
} from 'recharts'

const BUCKETS = [
  { label: '0-7',   min: 0,  max: 7,   color: '#F97316' },
  { label: '8-14',  min: 8,  max: 14,  color: '#F97316' },
  { label: '15-30', min: 15, max: 30,  color: '#F59E0B' },
  { label: '31-60', min: 31, max: 60,  color: '#EF4444' },
  { label: '60+',   min: 61, max: Infinity, color: '#DC2626' },
]

export default function AgeingDistribution({ data = [] }) {
  const bucketData = BUCKETS.map(b => ({
    label: b.label,
    count: data.filter(r => {
      const d = r.wo_ageing_days
      return d !== null && d >= b.min && d <= b.max
    }).length,
    color: b.color,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={bucketData} barSize={48}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
          cursor={{ fill: '#F8FAFC' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
          {bucketData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}