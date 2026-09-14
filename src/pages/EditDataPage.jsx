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
  CheckCircle2,
  Keyboard,
  Loader2,
  RotateCcw,
  Save,
  Send,
} from 'lucide-react'

import AppLayout from '../components/layout/AppLayout'
import SheetSelector from '../components/edit/SheetSelector'
import SpreadsheetGrid, {
  trimTrailingEmptyCells,
} from '../components/edit/SpreadsheetGrid'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'

import { useEditData } from '../hooks/useEditData'

import {
  commitChanges,
  postData,
} from '../api/editData'

import { ToastContext } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { EDIT_SHEETS } from '../utils/constants'


const EMPTY_SHEET_STATE = {
  original: [],
  draft: [],
  dirty: false,
  revision: 0,
}


function mapSheets(createValue) {
  return Object.fromEntries(
    EDIT_SHEETS.map(({ key }) => [key, createValue(key)]),
  )
}


function cloneMatrix(matrix) {
  return matrix.map(row => [...row])
}


function toCellString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value)
}


function matrixFromApiPayload(payload) {
  const headers = Array.isArray(
    payload?.headers,
  )
    ? payload.headers.map(toCellString)
    : []

  const rows = Array.isArray(
    payload?.rows,
  )
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


function matricesEqual(
  left,
  right,
) {
  const normalizedLeft =
    trimTrailingEmptyCells(left)

  const normalizedRight =
    trimTrailingEmptyCells(right)

  if (
    normalizedLeft.length !==
    normalizedRight.length
  ) {
    return false
  }

  for (
    let rowIndex = 0;
    rowIndex < normalizedLeft.length;
    rowIndex += 1
  ) {
    const leftRow =
      normalizedLeft[rowIndex]

    const rightRow =
      normalizedRight[rowIndex]

    const width = Math.max(
      leftRow.length,
      rightRow.length,
    )

    for (
      let columnIndex = 0;
      columnIndex < width;
      columnIndex += 1
    ) {
      if (
        toCellString(
          leftRow[columnIndex],
        ) !==
        toCellString(
          rightRow[columnIndex],
        )
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
    ...matrix.map(
      row => row.length,
    ),
  )
}


function isHeaderRowEmpty(matrix) {
  const headerRow =
    matrix[0] ?? []

  return headerRow.every(
    value =>
      toCellString(value).trim() === '',
  )
}


export default function EditDataPage() {
  const { user } = useAuth()

  const navigate = useNavigate()

  const queryClient =
    useQueryClient()

  const { showToast } =
    useContext(ToastContext)

  const { sheets } = useEditData()


  // ---------------------------------------------------------------------------
  // Page state
  // ---------------------------------------------------------------------------

  const [
    activeSheet,
    setActiveSheet,
  ] = useState('wos')


  const [
    sheetState,
    setSheetState,
  ] = useState(
    () => mapSheets(() => ({ ...EMPTY_SHEET_STATE })),
  )


  const [
    isCommitting,
    setIsCommitting,
  ] = useState(false)


  const [
    isPosting,
    setIsPosting,
  ] = useState(false)


  // Tracks which sheets have been explicitly
  // committed during the current posting cycle.
  const [
    committedSheets,
    setCommittedSheets,
  ] = useState(
    () => mapSheets(() => false),
  )


  // ---------------------------------------------------------------------------
  // Permission
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (
      user &&
      !user.can_edit_data
    ) {
      navigate(
        '/',
        {
          replace: true,
        },
      )
    }
  }, [
    user,
    navigate,
  ])


  // ---------------------------------------------------------------------------
  // Load API sheet data
  // ---------------------------------------------------------------------------

  const loadSheetPayload =
    useCallback(
      (
        sheetKey,
        payload,
      ) => {
        if (!payload) {
          return
        }

        const incomingMatrix =
          matrixFromApiPayload(
            payload,
          )

        setSheetState(
          previous => {
            // Never overwrite unsaved work
            // with a refetch response.
            if (
              previous[
                sheetKey
              ].dirty
            ) {
              return previous
            }

            return {
              ...previous,

              [sheetKey]: {
                original:
                  cloneMatrix(
                    incomingMatrix,
                  ),

                draft:
                  cloneMatrix(
                    incomingMatrix,
                  ),

                dirty: false,

                revision:
                  previous[
                    sheetKey
                  ].revision + 1,
              },
            }
          },
        )
      },
      [],
    )


  const wosPayload = sheets.wos.data
  const owsPayload = sheets.ows.data
  const grnQcPayload = sheets.grn_qc.data
  const woMiPayload = sheets.wo_mi.data


  useEffect(() => {
    loadSheetPayload('wos', wosPayload)
  }, [wosPayload, loadSheetPayload])


  useEffect(() => {
    loadSheetPayload('ows', owsPayload)
  }, [owsPayload, loadSheetPayload])


  useEffect(() => {
    loadSheetPayload('grn_qc', grnQcPayload)
  }, [grnQcPayload, loadSheetPayload])


  useEffect(() => {
    loadSheetPayload('wo_mi', woMiPayload)
  }, [woMiPayload, loadSheetPayload])


  // ---------------------------------------------------------------------------
  // Current sheet
  // ---------------------------------------------------------------------------

  const activeState =
    sheetState[activeSheet]


  const activeQuery =
    sheets[activeSheet]


  const activeSheetLabel =
    EDIT_SHEETS.find(
      sheet => sheet.key === activeSheet,
    )?.shortLabel ?? activeSheet


  const dirtySheets =
    useMemo(
      () => mapSheets(
        key => sheetState[key].dirty,
      ),
      [sheetState],
    )


  const hasAnyUnsavedChanges =
    Object.values(dirtySheets).some(Boolean)


  // ---------------------------------------------------------------------------
  // Post Data availability
  //
  // Post Data is enabled ONLY when:
  //
  // 1. WOS has been committed
  // 2. OWS has been committed
  // 3. No sheet has new unsaved changes
  // 4. No other request is running
  //
  // The QC sheets are optional: commit them when their reports change.
  // ---------------------------------------------------------------------------

  const canPostData =
    EDIT_SHEETS
      .filter(sheet => sheet.required)
      .every(sheet => committedSheets[sheet.key]) &&
    !hasAnyUnsavedChanges &&
    !isCommitting &&
    !isPosting


  // ---------------------------------------------------------------------------
  // If a previously committed sheet is edited again,
  // revoke its committed status.
  //
  // The user must commit that sheet again before
  // Post Data becomes available.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setCommittedSheets(
      previous => {
        const revokedKeys = EDIT_SHEETS
          .map(({ key }) => key)
          .filter(key => dirtySheets[key] && previous[key])

        if (revokedKeys.length === 0) {
          return previous
        }

        const next = { ...previous }

        for (const key of revokedKeys) {
          next[key] = false
        }

        return next
      },
    )
  }, [
    dirtySheets,
  ])


  // ---------------------------------------------------------------------------
  // Warn before closing browser with unsaved changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleBeforeUnload =
      event => {
        if (
          !hasAnyUnsavedChanges
        ) {
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
  }, [
    hasAnyUnsavedChanges,
  ])


  // ---------------------------------------------------------------------------
  // Sheet selector
  // ---------------------------------------------------------------------------

  const handleSheetChange =
    nextSheet => {
      setActiveSheet(
        nextSheet,
      )
    }


  // ---------------------------------------------------------------------------
  // Grid editing
  // ---------------------------------------------------------------------------

  const handleGridChange =
    useCallback(
      nextMatrix => {
        setSheetState(
          previous => {
            const current =
              previous[
                activeSheet
              ]

            const normalizedDraft =
              trimTrailingEmptyCells(
                nextMatrix,
              )

            return {
              ...previous,

              [activeSheet]: {
                ...current,

                draft:
                  cloneMatrix(
                    normalizedDraft,
                  ),

                dirty:
                  !matricesEqual(
                    normalizedDraft,
                    current.original,
                  ),
              },
            }
          },
        )
      },
      [
        activeSheet,
      ],
    )


  // ---------------------------------------------------------------------------
  // Reset current sheet
  // ---------------------------------------------------------------------------

  const handleReset = () => {
    setSheetState(
      previous => {
        const current =
          previous[
            activeSheet
          ]

        return {
          ...previous,

          [activeSheet]: {
            ...current,

            draft:
              cloneMatrix(
                current.original,
              ),

            dirty: false,

            revision:
              current.revision + 1,
          },
        }
      },
    )

    showToast(
      `${activeSheetLabel} changes reset.`,
      'success',
    )
  }


  // ---------------------------------------------------------------------------
  // Commit Current Sheet
  //
  // IMPORTANT:
  // This ONLY writes the selected sheet
  // back to Google Sheets.
  //
  // It does NOT trigger Databricks.
  // ---------------------------------------------------------------------------

  const handleCommit = async () => {
    const cleanedMatrix =
      trimTrailingEmptyCells(
        activeState.draft,
      )

    if (
      cleanedMatrix.length === 0 ||
      isHeaderRowEmpty(
        cleanedMatrix,
      )
    ) {
      showToast(
        'The first row must contain column names before committing.',
        'error',
      )

      return
    }


    const headers =
      cleanedMatrix[0].map(
        toCellString,
      )


    const rows =
      cleanedMatrix
        .slice(1)
        .map(
          row =>
            row.map(
              toCellString,
            ),
        )


    setIsCommitting(true)


    try {
      const result =
        await commitChanges({
          sheet_name:
            activeSheet,

          headers,

          rows,
        })


      const savedMatrix = [
        headers,
        ...rows,
      ]


      setSheetState(
        previous => {
          const current =
            previous[
              activeSheet
            ]

          return {
            ...previous,

            [activeSheet]: {
              original:
                cloneMatrix(
                  savedMatrix,
                ),

              draft:
                cloneMatrix(
                  savedMatrix,
                ),

              dirty: false,

              revision:
                current.revision + 1,
            },
          }
        },
      )


      // Keep the React Query cache
      // aligned with what was just saved.
      queryClient.setQueryData(
        [
          `edit-${activeSheet}`,
        ],
        {
          sheet_name:
            activeSheet,

          headers,

          rows,

          total_rows:
            rows.length,
        },
      )


      // Mark this particular sheet
      // as successfully committed.
      setCommittedSheets(
        previous => ({
          ...previous,

          [activeSheet]:
            true,
        }),
      )


      showToast(
        result.message ||
          `${activeSheetLabel} committed successfully.`,
        'success',
      )

    } catch (error) {
      showToast(
        error.response
          ?.data
          ?.detail ||
          'Failed to save changes.',
        'error',
      )

    } finally {
      setIsCommitting(false)
    }
  }


  // ---------------------------------------------------------------------------
  // Post Data
  //
  // IMPORTANT:
  // This is the ONLY button that triggers
  // Databricks.
  //
  // It does not write Google Sheets.
  // ---------------------------------------------------------------------------

  const handlePostData =
    async () => {
      if (!canPostData) {
        showToast(
          'Commit both WOS and OWS before posting data.',
          'error',
        )

        return
      }


      setIsPosting(true)


      try {
        const result =
          await postData()


        // Databricks has now been triggered.
        //
        // Start a fresh posting cycle.
        // Before another Databricks trigger,
        // both WOS and OWS must again
        // be explicitly committed.
        setCommittedSheets(
          mapSheets(() => false),
        )


        const runMessage =
          result.run_id
            ? ` Databricks run ID: ${result.run_id}.`
            : ''


        showToast(
          (
            result.message ||
            'Databricks processing triggered successfully.'
          ) +
            runMessage,
          'success',
        )

      } catch (error) {
        showToast(
          error.response
            ?.data
            ?.detail ||
            'Failed to trigger Databricks processing.',
          'error',
        )

      } finally {
        setIsPosting(false)
      }
    }


  // ---------------------------------------------------------------------------
  // Grid information
  // ---------------------------------------------------------------------------

  const dataRowCount =
    Math.max(
      0,
      activeState.draft.length -
        1,
    )


  const columnCount =
    getColumnCount(
      activeState.draft,
    )


  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <AppLayout scrollable>
      <div className="space-y-4 pt-4">

        {/* --------------------------------------------------------------- */}
        {/* Header */}
        {/* --------------------------------------------------------------- */}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Edit Data
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Excel-style editing for Google Sheets source data
            </p>
          </div>


          {/* ------------------------------------------------------------- */}
          {/* Actions */}
          {/* ------------------------------------------------------------- */}

          <div className="flex flex-wrap items-center gap-2">

            {/* Reset */}

            <button
              type="button"
              onClick={
                handleReset
              }
              disabled={
                !activeState.dirty ||
                isCommitting ||
                isPosting
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCcw
                size={16}
              />

              Reset current sheet
            </button>


            {/* Commit */}

            <button
              type="button"
              onClick={
                handleCommit
              }
              disabled={
                isCommitting ||
                isPosting ||
                activeQuery.isLoading ||
                activeQuery.isError ||
                committedSheets[
                  activeSheet
                ]
              }
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isCommitting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : committedSheets[
                  activeSheet
                ] ? (
                <CheckCircle2
                  size={16}
                />
              ) : (
                <Save
                  size={16}
                />
              )}

              {isCommitting
                ? 'Saving...'
                : committedSheets[
                      activeSheet
                    ]
                  ? 'Current sheet committed'
                  : 'Commit current sheet'}
            </button>


            {/* Post Data */}

            <button
              type="button"
              onClick={
                handlePostData
              }
              disabled={
                !canPostData
              }
              title={
                canPostData
                  ? 'Trigger Databricks data processing'
                  : 'Commit both WOS and OWS before posting'
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPosting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={16}
                />
              )}

              {isPosting
                ? 'Posting...'
                : 'Post Data'}
            </button>

          </div>
        </div>


        {/* --------------------------------------------------------------- */}
        {/* Sheet selector / sheet information */}
        {/* --------------------------------------------------------------- */}

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 2xl:flex-row 2xl:items-center 2xl:justify-between">

          <SheetSelector
            activeSheet={
              activeSheet
            }
            onChange={
              handleSheetChange
            }
            dirtySheets={
              dirtySheets
            }
          />


          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">

            <span>
              {dataRowCount}{' '}
              data rows
            </span>


            <span>
              {columnCount}{' '}
              used columns
            </span>


            {/* Commit status per sheet */}

            {EDIT_SHEETS.map(sheet => (
              <span
                key={sheet.key}
                className={
                  committedSheets[sheet.key]
                    ? 'inline-flex items-center gap-1.5 font-semibold text-emerald-600'
                    : 'inline-flex items-center gap-1.5 text-slate-400'
                }
              >
                {committedSheets[sheet.key] && (
                  <CheckCircle2
                    size={14}
                  />
                )}

                {sheet.shortLabel}{' '}
                {committedSheets[sheet.key]
                  ? 'committed'
                  : sheet.required
                    ? 'not committed'
                    : 'optional'}
              </span>
            ))}


            {activeState.dirty && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600">

                <span className="h-2 w-2 rounded-full bg-orange-500" />

                Unsaved changes in{' '}
                {activeSheetLabel}
              </span>
            )}

          </div>
        </div>


        {/* --------------------------------------------------------------- */}
        {/* Controls information */}
        {/* --------------------------------------------------------------- */}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">

          <span className="inline-flex items-center gap-2 font-semibold">
            <Keyboard
              size={16}
            />

            Spreadsheet controls
          </span>

          <span>
            Single click: select
          </span>

          <span>
            Double click: edit
          </span>

          <span>
            Triple click: select cell text
          </span>

          <span>
            Ctrl+A / Ctrl+C / Ctrl+X / Ctrl+V
          </span>

          <span>
            Delete / Backspace
          </span>

          <span>
            Right click for cell, row, and column actions
          </span>

        </div>


        {/* --------------------------------------------------------------- */}
        {/* Loading */}
        {/* --------------------------------------------------------------- */}

        {activeQuery.isLoading && (
          <LoadingSkeleton />
        )}


        {/* --------------------------------------------------------------- */}
        {/* Error */}
        {/* --------------------------------------------------------------- */}

        {activeQuery.isError && (
          <ErrorState
            message={
              activeQuery.error?.response?.data?.detail ||
              'Failed to load data'
            }
            onRetry={
              () => activeQuery.refetch()
            }
          />
        )}


        {/* --------------------------------------------------------------- */}
        {/* Spreadsheet */}
        {/* --------------------------------------------------------------- */}

        {!activeQuery.isLoading &&
          !activeQuery.isError && (
            <SpreadsheetGrid
              key={
                `${activeSheet}-${activeState.revision}`
              }
              sheetKey={
                activeSheet
              }
              data={
                activeState.draft
              }
              onDataChange={
                handleGridChange
              }
            />
          )}

      </div>
    </AppLayout>
  )
}