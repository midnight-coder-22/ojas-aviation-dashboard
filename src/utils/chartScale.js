function estimateTextWidth(text, fontSize) {
  let width = 0

  for (const character of text) {
    if (/[A-Z0-9]/.test(character)) width += 6.2
    else if (/[a-z]/.test(character)) width += 5
    else width += 3.5
  }

  return width * (fontSize / 9)
}

function measureWords(label, fontSize) {
  return String(label ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ word, width: estimateTextWidth(word, fontSize) }))
}

const TICK_GAP_PX = 3

/*
 * Half-width a centred label may use towards one neighbour. When the pair
 * overlaps, the shorter label keeps its full width and the longer one gives
 * way; two long labels split the boundary evenly.
 */
function allowedHalfWidth(ownHalf, neighbourHalf, band) {
  if (neighbourHalf === null) return ownHalf
  if (ownHalf + neighbourHalf + TICK_GAP_PX <= band) return ownHalf

  return Math.min(
    ownHalf,
    Math.max(
      (band - TICK_GAP_PX) / 2,
      band - neighbourHalf - TICK_GAP_PX,
    ),
  )
}

/**
 * Words of one axis category (one word per line), each shortened with "…"
 * only where it would overlap the same line of a neighbouring category.
 * Recharts passes custom ticks the axis `width`, `visibleTicksCount` and
 * `index`; the chart passes the ordered category labels.
 */
export function fitTickWords({
  label,
  categories = [],
  index,
  axisWidth,
  tickCount,
  fontSize = 9,
}) {
  const words = measureWords(label, fontSize)

  if (!(axisWidth > 0 && tickCount > 0)) {
    return words.map(({ word }) => word)
  }

  const band = axisWidth / tickCount
  const left = measureWords(categories[index - 1], fontSize)
  const right = measureWords(categories[index + 1], fontSize)
  const halfOf = (measured) => (measured ? measured.width / 2 : null)

  return words.map(({ word, width }, line) => {
    const available =
      2 *
      Math.min(
        allowedHalfWidth(width / 2, halfOf(left[line]), band),
        allowedHalfWidth(width / 2, halfOf(right[line]), band),
      )

    if (width <= available) return word

    let shortened = word
    while (
      shortened.length > 1 &&
      estimateTextWidth(`${shortened}…`, fontSize) > available
    ) {
      shortened = shortened.slice(0, -1)
    }

    return `${shortened}…`
  })
}

/**
 * Build an integer Y-axis scale for one chart only.
 *
 * Every chart passes its own maximum value, so Status, Flow and Incoming WOs
 * are not forced to share the same range.
 */
export function getIntegerAxisScale(
  maxValue,
  approximateTickCount = 4,
) {
  const numericMax = Number(maxValue)

  const safeMax =
    Number.isFinite(numericMax) && numericMax > 0
      ? numericMax
      : 0

  if (safeMax === 0) {
    return {
      domain: [0, 1],
      ticks: [0, 1],
    }
  }

  const targetTickCount = Math.max(
    2,
    Number(approximateTickCount) || 4,
  )

  const roughStep = safeMax / targetTickCount

  const magnitude =
    10 ** Math.floor(Math.log10(roughStep))

  const normalizedStep =
    roughStep / magnitude

  const niceMultiplier =
    normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 5
          ? 5
          : 10

  const step = Math.max(
    1,
    Math.ceil(niceMultiplier * magnitude),
  )

  // Leave room for values displayed above the bars.
  const axisMax = Math.max(
    step,
    Math.ceil((safeMax * 1.15) / step) * step,
  )

  const tickCount =
    Math.floor(axisMax / step) + 1

  return {
    domain: [0, axisMax],

    ticks: Array.from(
      { length: tickCount },
      (_, index) => index * step,
    ),
  }
}