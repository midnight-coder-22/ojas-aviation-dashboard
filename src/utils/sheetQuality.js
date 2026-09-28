// Checks on a pasted ERP report before it is committed.

// Excel shows long numbers in narrow columns as 2.63E+08 and copies that
// text, so the real value (262700485) is gone before it reaches the grid.
// Small numbers such as 6.00E-05 keep their value and are not flagged.
const LOST_DIGITS = /^\d(\.\d{1,4})?E\+\d+$/i

/*
 * Returns [{ column, count, example }] for every column with cells whose
 * digits were lost to scientific notation. The first row is the header row;
 * when the report keeps its title rows above the header, the column is named
 * after the widest row near the top instead.
 */
export function findScientificNotationColumns(matrix) {
  if (!Array.isArray(matrix) || matrix.length < 2) return []

  const headerRow = matrix
    .slice(0, 20)
    .reduce((widest, row) => (
      row.filter((cell) => String(cell ?? '').trim()).length >
      widest.filter((cell) => String(cell ?? '').trim()).length ? row : widest
    ), matrix[0])

  const found = new Map()

  matrix.slice(1).forEach((row) => {
    row.forEach((cell, index) => {
      const text = String(cell ?? '').trim()
      if (!LOST_DIGITS.test(text)) return

      const column = String(headerRow[index] ?? '').replace(/\s+/g, ' ').trim() || `Column ${index + 1}`
      const entry = found.get(column) ?? { column, count: 0, example: text }
      entry.count += 1
      found.set(column, entry)
    })
  })

  return [...found.values()]
}
