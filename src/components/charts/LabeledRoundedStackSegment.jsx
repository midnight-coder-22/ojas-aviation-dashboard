/**
 * Construct an explicit SVG path instead of relying on Recharts Rectangle
 * radius handling.
 *
 * This gives the upper visible segment reliably smooth upper corners.
 */
function createSegmentPath({
  x,
  y,
  width,
  height,
  roundTop,
  radius,
}) {
  const right = x + width
  const bottom = y + height

  const safeRadius = roundTop
    ? Math.min(
        Math.max(Number(radius) || 0, 0),
        width / 2,
        height,
      )
    : 0

  if (safeRadius === 0) {
    return [
      `M ${x} ${y}`,
      `H ${right}`,
      `V ${bottom}`,
      `H ${x}`,
      'Z',
    ].join(' ')
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

/**
 * Shared renderer for each priority section of a stacked bar.
 *
 * - Upper visible segment has smooth rounded corners.
 * - Every non-zero section displays its value beside the bar.
 * - The complete bar total is displayed above the stack.
 */
export default function LabeledRoundedStackSegment({
  x,
  y,
  width,
  height,
  fill,
  payload,
  dataKey,
  radius = 7,
  showTotal = true,
}) {
  const numericX = Number(x)
  const numericY = Number(y)
  const numericWidth = Number(width)
  const numericHeight = Number(height)

  const value = Number(
    payload?.[dataKey] ?? 0,
  )

  if (
    ![
      numericX,
      numericY,
      numericWidth,
      numericHeight,
      value,
    ].every(Number.isFinite) ||
    numericWidth <= 0 ||
    numericHeight <= 0 ||
    value <= 0
  ) {
    return null
  }

  const isTopSegment =
    payload?.topKey === dataKey

  const total = Number(
    payload?.total ?? value,
  )

  const sectionLabelX =
    numericX + numericWidth + 5

  const sectionLabelY =
    numericY + numericHeight / 2

  const path = createSegmentPath({
    x: numericX,
    y: numericY,
    width: numericWidth,
    height: numericHeight,
    roundTop: isTopSegment,
    radius,
  })

  return (
    <g>
      <path
        d={path}
        fill={fill}
        stroke="none"
        shapeRendering="geometricPrecision"
      />

      {/* Number beside this priority section */}
      <text
        x={sectionLabelX}
        y={sectionLabelY}
        textAnchor="start"
        dominantBaseline="middle"
        fill="#334155"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinejoin="round"
        paintOrder="stroke"
        fontSize={9}
        fontWeight={700}
        pointerEvents="none"
      >
        {value}
      </text>

      {/* Complete total above the full stacked bar */}
      {showTotal && isTopSegment && (
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
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
          fontSize={10}
          fontWeight={700}
          pointerEvents="none"
        >
          {total}
        </text>
      )}
    </g>
  )
}