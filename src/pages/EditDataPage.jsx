import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Keyboard,
  Loader2,
  RotateCcw,
  Save,
} from 'lucide-react'

import AppLayout from '../components/layout/AppLayout'
import SheetSelector from '../components/edit/SheetSelector'
import SpreadsheetGrid, {
  trimTrailingEmptyCells,
} from '../components/edit/SpreadsheetGrid'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'
import { useEditData } from '../hooks/useEditData'
import { commitChanges } from '../api/editData'
import { ToastContext } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

const EMPTY_SHEET_STATE = {
  original: [],
  draft: [],
  dirty: false,
  revision: 0,
}

function cloneMatrix(matrix) {
  return matrix.map(row => [...row])
}

function toCellString(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function matrixFromApiPayload(payload) {
  const headers = Array.isArray(payload?.headers)
    ? payload.headers.map(toCellString)
    : []

  const rows = Array.isArray(payload?.rows)
    ? payload.rows.map(row =>
        Array.isArray(row)
          ? row.map(toCellString)
          : [],
      )
    : []

  return trimTrailingEmptyCells([
    headers,
    ...rows,
  ])
}

function matricesEqual(left, right) {
  const normalizedLeft = trimTrailingEmptyCells(left)
  const normalizedRight = trimTrailingEmptyCells(right)

  if (normalizedLeft.length !== normalizedRight.length) {
    return false
  }

  for (
    let rowIndex = 0;
    rowIndex < normalizedLeft.length;
    rowIndex += 1
  ) {
    const leftRow = normalizedLeft[rowIndex]
    const rightRow = normalizedRight[rowIndex]
    const width = Math.max(leftRow.length, rightRow.length)

    for (
      let columnIndex = 0;
      columnIndex < width;
      columnIndex += 1
    ) {
      if (
        toCellString(leftRow[columnIndex]) !==
        toCellString(rightRow[columnIndex])
      ) {
        return false
      }
    }
  }

  return true
}

function getColumnCount(matrix) {
  return Math.max(
    0,
    ...matrix.map(row => row.length),
  )
}

function isHeaderRowEmpty(matrix) {
  const headerRow = matrix[0] ?? []

  return headerRow.every(
    value => toCellString(value).trim() === '',
  )
}

export default function EditDataPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useContext(ToastContext)

  const {
    wosData,
    owsData,
    isLoading,
    isError,
    refetchAll,
  } = useEditData()

  const [activeSheet, setActiveSheet] = useState('wos')
  const [sheetState, setSheetState] = useState({
    wos: { ...EMPTY_SHEET_STATE },
    ows: { ...EMPTY_SHEET_STATE },
  })
  const [isCommitting, setIsCommitting] = useState(false)

  useEffect(() => {
    if (user && !user.can_edit_data) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const loadSheetPayload = useCallback(
    (sheetKey, payload) => {
      if (!payload) {
        return
      }

      const incomingMatrix = matrixFromApiPayload(payload)

      setSheetState(previous => {
        // Never overwrite unsaved work with a background/refetch response.
        if (previous[sheetKey].dirty) {
          return previous
        }

        return {
          ...previous,
          [sheetKey]: {
            original: cloneMatrix(incomingMatrix),
            draft: cloneMatrix(incomingMatrix),
            dirty: false,
            revision:
              previous[sheetKey].revision + 1,
          },
        }
      })
    },
    [],
  )

  useEffect(() => {
    loadSheetPayload('wos', wosData)
  }, [wosData, loadSheetPayload])

  useEffect(() => {
    loadSheetPayload('ows', owsData)
  }, [owsData, loadSheetPayload])

  const activeState = sheetState[activeSheet]
  const dirtySheets = useMemo(
    () => ({
      wos: sheetState.wos.dirty,
      ows: sheetState.ows.dirty,
    }),
    [sheetState],
  )

  const hasAnyUnsavedChanges =
    dirtySheets.wos || dirtySheets.ows

  useEffect(() => {
    const handleBeforeUnload = event => {
      if (!hasAnyUnsavedChanges) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload,
    )

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload,
      )
    }
  }, [hasAnyUnsavedChanges])

  const handleSheetChange = nextSheet => {
    setActiveSheet(nextSheet)
  }

  const handleGridChange = useCallback(
    nextMatrix => {
      setSheetState(previous => {
        const current = previous[activeSheet]
        const normalizedDraft =
          trimTrailingEmptyCells(nextMatrix)

        return {
          ...previous,
          [activeSheet]: {
            ...current,
            draft: cloneMatrix(normalizedDraft),
            dirty: !matricesEqual(
              normalizedDraft,
              current.original,
            ),
          },
        }
      })
    },
    [activeSheet],
  )

  const handleReset = () => {
    setSheetState(previous => {
      const current = previous[activeSheet]

      return {
        ...previous,
        [activeSheet]: {
          ...current,
          draft: cloneMatrix(current.original),
          dirty: false,
          revision: current.revision + 1,
        },
      }
    })

    showToast(
      `${activeSheet.toUpperCase()} changes reset.`,
      'success',
    )
  }

  const handleCommit = async () => {
    const cleanedMatrix = trimTrailingEmptyCells(
      activeState.draft,
    )

    if (
      cleanedMatrix.length === 0 ||
      isHeaderRowEmpty(cleanedMatrix)
    ) {
      showToast(
        'The first row must contain column names before committing.',
        'error',
      )
      return
    }

    const headers = cleanedMatrix[0].map(toCellString)
    const rows = cleanedMatrix
      .slice(1)
      .map(row => row.map(toCellString))

    setIsCommitting(true)

    try {
      const result = await commitChanges({
        sheet_name: activeSheet,
        headers,
        rows,
      })

      const savedMatrix = [
        headers,
        ...rows,
      ]

      setSheetState(previous => {
        const current = previous[activeSheet]

        return {
          ...previous,
          [activeSheet]: {
            original: cloneMatrix(savedMatrix),
            draft: cloneMatrix(savedMatrix),
            dirty: false,
            revision: current.revision + 1,
          },
        }
      })

      queryClient.setQueryData(
        [`edit-${activeSheet}`],
        {
          sheet_name: activeSheet,
          headers,
          rows,
          total_rows: rows.length,
        },
      )

      showToast(
        result.message || 'Changes saved.',
        'success',
      )
    } catch (error) {
      showToast(
        error.response?.data?.detail ||
          'Failed to save changes.',
        'error',
      )
    } finally {
      setIsCommitting(false)
    }
  }

  const dataRowCount = Math.max(
    0,
    activeState.draft.length - 1,
  )
  const columnCount = getColumnCount(
    activeState.draft,
  )

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Edit Data
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Excel-style editing for Google Sheets source data
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={
                !activeState.dirty || isCommitting
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCcw size={16} />
              Reset current sheet
            </button>

            <button
              type="button"
              onClick={handleCommit}
              disabled={
                !activeState.dirty || isCommitting
              }
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isCommitting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}
              {isCommitting
                ? 'Saving...'
                : 'Commit current sheet'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
          <SheetSelector
            activeSheet={activeSheet}
            onChange={handleSheetChange}
            dirtySheets={dirtySheets}
          />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span>
              {dataRowCount} data rows
            </span>
            <span>
              {columnCount} used columns
            </span>

            {activeState.dirty && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Unsaved changes in{' '}
                {activeSheet.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Keyboard size={16} />
            Spreadsheet controls
          </span>
          <span>Single click: select</span>
          <span>Double click: edit</span>
          <span>Triple click: select cell text</span>
          <span>Ctrl+A / Ctrl+C / Ctrl+X / Ctrl+V</span>
          <span>Delete / Backspace</span>
          <span>Right click for cell, row, and column actions</span>
        </div>

        {isLoading && <LoadingSkeleton />}

        {isError && (
          <ErrorState onRetry={refetchAll} />
        )}

        {!isLoading && !isError && (
          <SpreadsheetGrid
            key={`${activeSheet}-${activeState.revision}`}
            sheetKey={activeSheet}
            data={activeState.draft}
            onDataChange={handleGridChange}
          />
        )}
      </div>
    </AppLayout>
  )
}
