import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getIntegerAxisScale } from '../../utils/chartScale'

function createRoundedBarPath({ x, y, width, height, radius = 7 }) {
  const safeRadius = Math.min(
    Math.max(Number(radius) || 0, 0),
    width / 2,
    height,
  )
  const right = x + width
  const bottom = y + height

  if (safeRadius === 0) {
    return `M ${x} ${y} H ${right} V ${bottom} H ${x} Z`
  }

  return [
    `M ${x} ${bottom}`,
    `V ${y + safeRadius}`,
    `Q ${x} ${y} ${x + safeRadius} ${y}`,
    `H ${right - safeRadius}`,
    `Q ${right} ${y} ${right} ${y + safeRadius}`,
    `V ${bottom}`,
    `H ${x}`,
    'Z',
  ].join(' ')
}

function sameValue(first, second) {
  return String(first ?? '').trim().toLowerCase() ===
    String(second ?? '').trim().toLowerCase()
}

function CategoryTick({
  x,
  y,
  payload,
  activeValue,
  interactive,
  onClick,
}) {
  const value = String(payload?.value ?? '').trim()
  const words = value.split(/\s+/)
  const isActive = activeValue && sameValue(activeValue, value)

  const activate = () => {
    if (interactive && value) onClick?.(value)
  }

  return (
    <g
      transform={`translate(${x},${y})`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          activate()
        }
      }}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      <text
        textAnchor="middle"
        fill={isActive ? '#0F172A' : '#64748B'}
        fontSize={9}
        fontWeight={isActive ? 700 : 400}
      >
        {words.map((word, index) => (
          <tspan
            key={`${word}-${index}`}
            x={0}
            dy={index === 0 ? 12 : 11}
          >
            {word}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function RoundedValueBar({
  x,
  y,
  width,
  height,
  fill,
  payload,
  activeValue,
  interactive,
  onClick,
}) {
  const numericX = Number(x)
  const numericY = Number(y)
  const numericWidth = Number(width)
  const numericHeight = Number(height)
  const value = Number(payload?.value) || 0

  if (
    ![
      numericX,
      numericY,
      numericWidth,
      numericHeight,
    ].every(Number.isFinite) ||
    numericWidth <= 0 ||
    numericHeight <= 0 ||
    value <= 0
  ) {
    return null
  }

  const selected = activeValue && sameValue(activeValue, payload?.name)
  const dimmed = activeValue && !selected
  const path = createRoundedBarPath({
    x: numericX,
    y: numericY,
    width: numericWidth,
    height: numericHeight,
    radius: 7,
  })

  const activate = () => {
    if (interactive) onClick?.(payload?.name)
  }

  return (
    <g
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          activate()
        }
      }}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
      opacity={dimmed ? 0.28 : 1}
    >
      <path
        d={path}
        fill={fill}
        stroke={selected ? '#0F172A' : 'none'}
        strokeWidth={selected ? 2 : 0}
        shapeRendering="geometricPrecision"
      />
      <text
        x={numericX + numericWidth / 2}
        y={Math.max(10, numericY - 6)}
        textAnchor="middle"
        fill="#334155"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinejoin="round"
        paintOrder="stroke"
        fontSize={10}
        fontWeight={700}
        pointerEvents="none"
      >
        {value}
      </text>
    </g>
  )
}

export default function StandardSingleBarChart({
  data = [],
  emptyMessage = 'No chart data available',
  yAxisLabel = 'WO count',
  activeValue = null,
  onCategoryClick,
}) {
  const hasData = data.some((row) => Number(row.value) > 0)

  if (!hasData) {
    return (
      <div className="flex h-full min-h-[175px] items-center justify-center px-4 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const axisScale = getIntegerAxisScale(
    Math.max(0, ...data.map((row) => Number(row.value) || 0)),
  )

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={175}>
      <BarChart
        data={data}
        barCategoryGap="34%"
        margin={{ top: 18, right: 18, bottom: 8, left: 0 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="#E2E8F0"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          interval={0}
          height={42}
          tick={
            <CategoryTick
              activeValue={activeValue}
              interactive={Boolean(onCategoryClick)}
              onClick={onCategoryClick}
            />
          }
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={34}
          domain={axisScale.domain}
          ticks={axisScale.ticks}
          tick={{ fontSize: 9, fill: '#94A3B8' }}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748B',
                  fontSize: 9,
                }
              : undefined
          }
        />
        <Tooltip
          cursor={{ fill: '#F8FAFC' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="value"
          maxBarSize={32}
          isAnimationActive={false}
          shape={(shapeProps) => (
            <RoundedValueBar
              {...shapeProps}
              activeValue={activeValue}
              interactive={Boolean(onCategoryClick)}
              onClick={onCategoryClick}
            />
          )}
        >
          {data.map((row) => (
            <Cell key={row.name} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
