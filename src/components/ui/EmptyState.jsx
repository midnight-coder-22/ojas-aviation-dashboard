import { Inbox } from 'lucide-react'

export default function EmptyState({
  message    = 'No work orders found',
  subMessage = 'This department currently has no active work orders.',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Inbox size={48} className="text-slate-300" />
      <p className="text-lg font-semibold text-slate-700 mt-4">{message}</p>
      <p className="text-sm text-slate-500 mt-1">{subMessage}</p>
    </div>
  )
}