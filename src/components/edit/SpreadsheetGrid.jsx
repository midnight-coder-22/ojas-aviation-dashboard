import {
  useCallback,
  useEffect,
  useRef,
} from 'react'
import {
  Spreadsheet,
  Worksheet,
} from '@jspreadsheet-ce/react'

import 'jsuites/dist/jsuites.css'
import 'jspreadsheet-ce/dist/jspreadsheet.css'

const MIN_VISIBLE_COLUMNS = 30
const MIN_VISIBLE_ROWS = 500
const SPARE_COLUMNS = 5
const SPARE_ROWS = 100

function isBlank(value) {
  return (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  )
}

function normalizeCell(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return value
}

function normalizeMatrix(matrix) {
  if (!Array.isArray(matrix)) {
    return []
  }

  return matrix.map(row =>
    Array.isArray(row)
      ? row.map(normalizeCell)
      : []
  )
}

/**
 * Removes only unused rows and columns at the bottom and right edges.
 * Blank cells inside the actual dataset are preserved.
 */
export function trimTrailingEmptyCells(matrix) {
  const normalized = normalizeMatrix(matrix)

  let lastUsedRow = normalized.length - 1

  while (
    lastUsedRow >= 0 &&
    normalized[lastUsedRow].every(isBlank)
  ) {
    lastUsedRow -= 1
  }

  if (lastUsedRow < 0) {
    return []
  }

  const usedRows = normalized.slice(0, lastUsedRow + 1)
  let lastUsedColumn = -1

  for (const row of usedRows) {
    for (
      let columnIndex = row.length - 1;
      columnIndex >= 0;
      columnIndex -= 1
    ) {
      if (!isBlank(row[columnIndex])) {
        lastUsedColumn = Math.max(
          lastUsedColumn,
          columnIndex,
        )
        break
      }
    }
  }

  if (lastUsedColumn < 0) {
    return []
  }

  return usedRows.map(row =>
    Array.from(
      { length: lastUsedColumn + 1 },
      (_, columnIndex) =>
        normalizeCell(row[columnIndex]),
    )
  )
}

function getMatrixWidth(matrix) {
  return Math.max(
    0,
    ...matrix.map(row => row.length),
  )
}

function getColumnLabel(index) {
  let number = index + 1
  let label = ''

  while (number > 0) {
    const remainder = (number - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    number = Math.floor((number - 1) / 26)
  }

  return label
}

function selectEditorContents(editor) {
  if (!editor) {
    return
  }

  editor.focus?.()

  if (
    editor instanceof HTMLInputElement ||
    editor instanceof HTMLTextAreaElement
  ) {
    editor.select()
    return
  }

  const selection = window.getSelection()

  if (!selection) {
    return
  }

  const range = document.createRange()
  range.selectNodeContents(editor)
  selection.removeAllRanges()
  selection.addRange(range)
}

export default function SpreadsheetGrid({
  data = [],
  sheetKey = 'sheet',
  onDataChange,
}) {
  const spreadsheetRef = useRef(null)
  const editorRef = useRef(null)
  const syncTimerRef = useRef(null)
  const onDataChangeRef = useRef(onDataChange)

  onDataChangeRef.current = onDataChange

  // Jspreadsheet owns its internal state. Freeze the initial props for this
  // mount; the parent changes the component key when a load, reset, commit,
  // or sheet switch must recreate the grid.
  const initialConfigRef = useRef(null)

  if (initialConfigRef.current === null) {
    const initialMatrix = trimTrailingEmptyCells(data)
    const columnCount = Math.max(
      MIN_VISIBLE_COLUMNS,
      getMatrixWidth(initialMatrix) + SPARE_COLUMNS,
    )
    const rowCount = Math.max(
      MIN_VISIBLE_ROWS,
      initialMatrix.length + SPARE_ROWS,
    )

    initialConfigRef.current = {
      initialMatrix,
      columnCount,
      rowCount,
      columns: Array.from(
        { length: columnCount },
        (_, index) => ({
          type: 'text',
          title: getColumnLabel(index),
          width: index === 0 ? 110 : 160,
          readOnly: false,
        }),
      ),
    }
  }

  const {
    initialMatrix,
    columnCount,
    rowCount,
    columns,
  } = initialConfigRef.current

  const getWorksheet = useCallback(() => {
    const spreadsheet = spreadsheetRef.current

    if (Array.isArray(spreadsheet)) {
      return spreadsheet[0] ?? null
    }

    if (spreadsheet && Array.isArray(spreadsheet.worksheets)) {
      return spreadsheet.worksheets[0] ?? null
    }

    if (spreadsheet?.[0]) {
      return spreadsheet[0]
    }

    return null
  }, [])

  const syncWorksheet = useCallback(
    candidateWorksheet => {
      const worksheet =
        candidateWorksheet &&
        typeof candidateWorksheet.getData === 'function'
          ? candidateWorksheet
          : getWorksheet()

      if (!worksheet) {
        return
      }

      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
      }

      syncTimerRef.current = window.setTimeout(() => {
        const nextMatrix = trimTrailingEmptyCells(
          worksheet.getData(false, false),
        )

        onDataChangeRef.current?.(nextMatrix)
      }, 0)
    },
    [getWorksheet],
  )

  useEffect(
    () => () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
      }
    },
    [],
  )

  const handleCreateEditor = useCallback(
    (worksheet, cell, x, y, input) => {
      editorRef.current = input
    },
    [],
  )

  const handleEditionEnd = useCallback(() => {
    editorRef.current = null
  }, [])

  const handleTripleClick = useCallback(
    event => {
      if (event.detail !== 3) {
        return
      }

      const cell = event.target.closest?.(
        'td[data-x][data-y]',
      )

      if (!cell) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const worksheet = getWorksheet()

      if (!worksheet) {
        return
      }

      if (editorRef.current) {
        selectEditorContents(editorRef.current)
        return
      }

      if (typeof worksheet.openEditor !== 'function') {
        return
      }

      worksheet.openEditor(
        cell,
        false,
        event.nativeEvent,
      )

      window.requestAnimationFrame(() => {
        const editor =
          editorRef.current ??
          cell.querySelector(
            'input, textarea, [contenteditable="true"]',
          )

        selectEditorContents(editor)
      })
    },
    [getWorksheet],
  )

  return (
    <div
      className="excel-grid-shell"
      onClickCapture={handleTripleClick}
    >
      <Spreadsheet
        ref={spreadsheetRef}
        onafterchanges={syncWorksheet}
        onpaste={syncWorksheet}
        oninsertrow={syncWorksheet}
        ondeleterow={syncWorksheet}
        oninsertcolumn={syncWorksheet}
        ondeletecolumn={syncWorksheet}
        onmoverow={syncWorksheet}
        onmovecolumn={syncWorksheet}
        onundo={syncWorksheet}
        onredo={syncWorksheet}
        oncreateeditor={handleCreateEditor}
        oneditionend={handleEditionEnd}
      >
        <Worksheet
          worksheetName={sheetKey.toUpperCase()}
          data={initialMatrix}
          columns={columns}
          minDimensions={[columnCount, rowCount]}
          tableOverflow
          tableWidth="100%"
          tableHeight="calc(100vh - 310px)"
          allowInsertRow
          allowDeleteRow
          allowInsertColumn
          allowDeleteColumn
          columnDrag
          rowDrag
          wordWrap={false}
          selectionCopy
        />
      </Spreadsheet>
    </div>
  )
}
