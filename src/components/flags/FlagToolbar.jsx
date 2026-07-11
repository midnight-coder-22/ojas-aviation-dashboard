import { useState, useContext } from 'react'
import { Flag, ShieldCheck, CheckCircle, X } from 'lucide-react'
import { raiseFlags, resolveFlags } from '../../api/flags'
import { ToastContext } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

export default function FlagToolbar({
  dept,
  data           = [],
  flagMode,
  setFlagMode,
  selectedWoIds,
  setSelectedWoIds,
  preExistingIds,
  setPreExistingIds,
  onFlagSuccess,
}) {
  const { user }    = useAuth()
  const { showToast } = useContext(ToastContext)
  const [loading,   setLoading] = useState(false)

  const startAddMode = () => {
    const existingFlagged = new Set(
      data.filter(r => r.has_active_flag).map(r => r.wo_id)
    )
    setPreExistingIds(existingFlagged)
    setSelectedWoIds(new Set(existingFlagged))
    setFlagMode('add')
  }

  const startResolveMode = () => {
    const flaggedIds = new Set(
      data.filter(r => r.has_active_flag).map(r => r.wo_id)
    )
    setSelectedWoIds(flaggedIds)
    setFlagMode('resolve')
  }

  const handleCancel = () => {
    setFlagMode(null)
    setSelectedWoIds(new Set())
    setPreExistingIds(new Set())
  }

  const handleAddDone = async () => {
    const newIds = [...selectedWoIds].filter(id => !preExistingIds.has(id))
    if (newIds.length === 0) { handleCancel(); return }

    setLoading(true)
    try {
      const result = await raiseFlags({ wo_ids: newIds, department: dept })
      showToast(result.message || `${newIds.length} flag(s) raised.`, 'success')
      onFlagSuccess()
      handleCancel()
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to raise flags.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveDone = async () => {
    if (selectedWoIds.size === 0) { handleCancel(); return }

    setLoading(true)
    try {
      const result = await resolveFlags({ wo_ids: [...selectedWoIds] })
      showToast(result.message || `${selectedWoIds.size} flag(s) resolved.`, 'success')
      onFlagSuccess()
      handleCancel()
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to resolve flags.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user?.can_flag && !user?.can_resolve_flag) return null

  return (
    <div className="flex items-center gap-2 py-3 border-b border-slate-100">
      {/* ADD FLAG */}
      {user?.can_flag && (
        <>
          {flagMode === 'add' ? (
            <button
              onClick={handleAddDone}
              disabled={loading}
              className="bg-orange-500 text-white rounded-xl px-3 py-1.5 text-sm
                         flex items-center gap-1.5 disabled:opacity-60"
            >
              <CheckCircle size={14} />
              {loading ? 'Saving...' : 'Done'}
            </button>
          ) : (
            <button
              onClick={startAddMode}
              disabled={flagMode === 'resolve'}
              className="border border-slate-200 text-slate-600 rounded-xl px-3 py-1.5 text-sm
                         flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-40"
            >
              <Flag size={14} />
              Add Flag
            </button>
          )}
        </>
      )}

      {/* RESOLVE FLAGS */}
      {user?.can_resolve_flag && (
        <>
          {flagMode === 'resolve' ? (
            <button
              onClick={handleResolveDone}
              disabled={loading}
              className="bg-green-500 text-white rounded-xl px-3 py-1.5 text-sm
                         flex items-center gap-1.5 disabled:opacity-60"
            >
              <CheckCircle size={14} />
              {loading ? 'Saving...' : 'Done'}
            </button>
          ) : (
            <button
              onClick={startResolveMode}
              disabled={flagMode === 'add'}
              className="border border-slate-200 text-slate-600 rounded-xl px-3 py-1.5 text-sm
                         flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-40"
            >
              <ShieldCheck size={14} />
              Resolve Flags
            </button>
          )}
        </>
      )}

      {/* Cancel */}
      {flagMode && (
        <button
          onClick={handleCancel}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <X size={13} /> Cancel
        </button>
      )}
    </div>
  )
}