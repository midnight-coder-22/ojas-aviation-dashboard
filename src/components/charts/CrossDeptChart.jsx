import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const DEPT_ABBREV = {
  'CNC': 'CNC', 'VMC': 'VMC', 'CONVENTIONAL': 'CONV',
  'SHEET METAL': 'SM', 'PRODUCTION': 'PROD', 'EDM': 'EDM',
}

export default function CrossDeptChart({ summaries = [] }) {
  const data = summaries.map(s => ({
    dept:      DEPT_ABBREV[s.department] || s.department,
    'Total WOs':   s.total_wos,
    'QC Alerts':   s.qc_alert_count,
    'MI Alerts':   s.mi_alert_count,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Total WOs" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={14} />
        <Bar dataKey="QC Alerts" fill="#FBBF24" radius={[4, 4, 0, 0]} barSize={14} />
        <Bar dataKey="MI Alerts" fill="#F87171" radius={[4, 4, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}