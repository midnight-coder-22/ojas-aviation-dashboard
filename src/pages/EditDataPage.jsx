import { useState, useEffect, useContext } from 'react'
import { useNavigate }       from 'react-router-dom'
import { RotateCcw, Save, Loader2, Search } from 'lucide-react'

import AppLayout       from '../components/layout/AppLayout'
import SheetSelector   from '../components/edit/SheetSelector'
import SpreadsheetGrid from '../components/edit/SpreadsheetGrid'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState      from '../components/ui/ErrorState'
import { useEditData } from '../hooks/useEditData'
import { commitChanges } from '../api/editData'
import { ToastContext } from '../context/ToastContext'
import { useAuth }     from '../context/AuthContext'

export default function EditDataPage() {
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const { showToast } = useContext(ToastContext)

  const { wosData, owsData, isLoading, isError, refetchAll } = useEditData()

  const [activeSheet,   setActiveSheet]   = useState('wos')
  const [wosHeaders,    setWosHeaders]    = useState([])
  const [owsHeaders,    setOwsHeaders]    = useState([])
  const [wosOrigRows,   setWosOrigRows]   = useState([])
  const [owsOrigRows,   setOwsOrigRows]   = useState([])
  const [wosEditRows,   setWosEditRows]   = useState([])
  const [owsEditRows,   setOwsEditRows]   = useState([])
  const [isDirty,       setIsDirty]       = useState(false)
  const [isCommitting,  setIsCommitting]  = useState(false)
  const [searchText,    setSearchText]    = useState('')

  // Redirect if no permission
  useEffect(() => {
    if (user && !user.can_edit_data) navigate('/', { replace: true })
  }, [user, navigate])

  // Load data into state when API responds
  useEffect(() => {
    if (wosData) {
      setWosHeaders(wosData.headers)
      setWosOrigRows(wosData.rows)
      setWosEditRows(wosData.rows.map(r => [...r]))
    }
  }, [wosData])

  useEffect(() => {
    if (owsData) {
      setOwsHeaders(owsData.headers)
      setOwsOrigRows(owsData.rows)
      setOwsEditRows(owsData.rows.map(r => [...r]))
    }
  }, [owsData])

  const headers  = activeSheet === 'wos' ? wosHeaders  : owsHeaders
  const origRows = activeSheet === 'wos' ? wosOrigRows : owsOrigRows
  const editRows = activeSheet === 'wos' ? wosEditRows : owsEditRows
  const setEditRows = activeSheet === 'wos' ? setWosEditRows : setOwsEditRows

  const handleCellChange = (rowIdx, colIdx, value) => {
    setEditRows(prev => {
      const next = prev.map(r => [...r])
      next[rowIdx][colIdx] = value
      return next
    })
    setIsDirty(true)
  }

  const handleReset = () => {
    setWosEditRows(wosOrigRows.map(r => [...r]))
    setOwsEditRows(owsOrigRows.map(r => [...r]))
    setIsDirty(false)
  }

  const handleCommit = async () => {
    setIsCommitting(true)
    try {
      const result = await commitChanges({
        sheet_name: activeSheet,
        headers,
        rows: editRows,
      })
      showToast(result.message || 'Changes saved.', 'success')
      // Update origRows so isDirty resets correctly
      if (activeSheet === 'wos') setWosOrigRows(editRows.map(r => [...r]))
      else setOwsOrigRows(editRows.map(r => [...r]))
      setIsDirty(false)
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to save changes.', 'error')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <AppLayout>
      {/* ---- HEADER ---- */}
      <div className="flex items-center justify-between pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Data</h1>
          <p className="text-sm text-slate-500 mt-1">View and edit Google Sheets source data</p>
        </div>

        <SheetSelector activeSheet={activeSheet} onChange={setActiveSheet} />

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!isDirty}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600
                       flex items-center gap-1.5 hover:bg-slate-50
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleCommit}
            disabled={!isDirty || isCommitting}
            className={`rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5
              ${!isDirty || isCommitting
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
          >
            {isCommitting
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Save size={14} /> Commit Changes</>
            }
          </button>
        </div>
      </div>

      {/* ---- INFO BAR ---- */}
      <div className="flex justify-between items-center py-2 text-xs text-slate-500 mb-2">
        <span>
          {editRows.length} rows · {headers.length} columns
          {isDirty && <span className="ml-3 text-orange-500 font-medium">● Unsaved changes</span>}
        </span>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search any value..."
            className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm w-56
                       focus:border-orange-300 focus:outline-none"
          />
        </div>
      </div>

      {/* ---- GRID ---- */}
      {isLoading && <LoadingSkeleton type="table" />}
      {isError   && <ErrorState onRetry={refetchAll} />}
      {!isLoading && !isError && (
        <SpreadsheetGrid
          headers={headers}
          rows={origRows}
          editedRows={editRows}
          onCellChange={handleCellChange}
          searchText={searchText}
        />
      )}
    </AppLayout>
  )
}