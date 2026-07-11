import { useEffect, useState } from 'react'

export default function KPICard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  suffix,
  valueColor,
  accentColor,
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const isDecimal = typeof value === 'number' && !Number.isInteger(value)

  // Count-up animation from 0 to value over 800ms
  useEffect(() => {
    if (!value && value !== 0) return
    const duration = 800
    const steps    = 40
    const increment = value / steps
    let current    = 0
    let step       = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, value)
      setDisplayValue(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const formatted = isDecimal
    ? displayValue.toFixed(1)
    : Math.round(displayValue)

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 min-w-40 overflow-hidden">
      {/* Icon */}
      <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
        <Icon size={18} className={iconColor} />
      </div>

      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-4">
        {label}
      </p>

      {/* Value */}
      <p className={`text-3xl font-bold mt-1 ${valueColor || 'text-slate-900'}`}>
        {formatted}
        {suffix && <span className="text-sm font-normal text-slate-400 ml-1">{suffix}</span>}
      </p>

      {/* Accent bar at bottom */}
      {accentColor && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${accentColor} rounded-b-2xl opacity-60`} />
      )}
    </div>
  )
}