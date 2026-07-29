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