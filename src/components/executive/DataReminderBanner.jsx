import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDataReminder } from '../../hooks/useExecutiveData'

/*
 * Rendered from AppLayout (not just the Executive page) because the Admin
 * lands on their own department dashboard, not Executive - this needs to
 * be visible wherever they are. Computed lazily on load/poll, not pushed at
 * a fixed clock time: no Cloud Scheduler, no email, per the user's choice.
 * Dismissing only hides it for the current page; it reappears on the next
 * navigation or refresh if the underlying condition (no data posted today,
 * past 8:45 AM IST) still holds.
 */
export default function DataReminderBanner() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const { data } = useDataReminder(isAdmin)
  const [dismissed, setDismissed] = useState(false)

  if (!isAdmin || !data?.show || dismissed) return null

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2 text-sm text-amber-800">
      <AlertTriangle size={15} className="shrink-0" />
      <span className="min-w-0 flex-1">{data.message}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss reminder"
        className="shrink-0 rounded p-0.5 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
      >
        <X size={14} />
      </button>
    </div>
  )
}
