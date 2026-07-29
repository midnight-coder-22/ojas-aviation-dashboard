import { Rectangle } from 'recharts'

/**
 * Draws one stacked-bar segment.
 *
 * - The top non-zero segment gets rounded upper corners.
 * - Every non-zero segment receives a permanent value label.
 * - Small segments move their label to the right side.
 * - The complete stack total is displayed above the top segment.
 */
export default function LabeledRoundedStackSegment({
  x,
  y,
  width,
  height,
  fill,
  payload,
  dataKey,
  radius = 5,
}) {
  const numericX = Number(x)
  const numericY = Number(y)
  const numericWidth = Number(width)
  const numericHeight = Number(height)

  const value = Number(
    payload?.[dataKey] ?? 0,
  )

  const dimensions = [
    numericX,
    numericY,
    numericWidth,
    numericHeight,
    value,
  ]

  if (
    !dimensions.every(Number.isFinite) ||
    numericWidth <= 0 ||
    numericHeight <= 0 ||
    value <= 0
  ) {
    return null
  }

  const isTopSegment =
    payload?.topKey === dataKey

  const fitsInside =
    numericHeight >= 15 &&
    numericWidth >= 22

  const labelX = fitsInside
    ? numericX + numericWidth / 2
    : numericX + numericWidth + 4

  const labelY =
    numericY + numericHeight / 2

  const normalizedFill =
    String(fill ?? '').toUpperCase()

  // Amber needs dark text; green and red work better with white.
  const insideLabelColor =
    normalizedFill === '#F59E0B'
      ? '#0F172A'
      : '#FFFFFF'

  const stackTotal = Number(
    payload?.total ?? value,
  )

  return (
    <g>
      <Rectangle
        x={numericX}
        y={numericY}
        width={numericWidth}
        height={numericHeight}
        fill={fill}
        radius={
          isTopSegment
            ? [radius, radius, 0, 0]
            : [0, 0, 0, 0]
        }
      />

      <text
        x={labelX}
        y={labelY}
        textAnchor={
          fitsInside ? 'middle' : 'start'
        }
        dominantBaseline="middle"
        fill={
          fitsInside
            ? insideLabelColor
            : '#475569'
        }
        fontSize={9}
        fontWeight={700}
        pointerEvents="none"
      >
        {value}
      </text>

      {isTopSegment && (
        <text
          x={
            numericX +
            numericWidth / 2
          }
          y={Math.max(
            10,
            numericY - 6,
          )}
          textAnchor="middle"
          fill="#334155"
          fontSize={10}
          fontWeight={700}
          pointerEvents="none"
        >
          {stackTotal}
        </text>
      )}
    </g>
  )
}