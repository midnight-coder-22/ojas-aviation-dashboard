import { AlertCircle } from 'lucide-react'

export default function ErrorState({
  message = 'Failed to load data',
  onRetry,
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <AlertCircle size={20} className="text-red-500 shrink-0" />
        <p className="font-semibold text-red-700">{message}</p>
      </div>
      <p className="text-sm text-red-500 mt-1">
        Could not connect to the Ojas Aviation API.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 border border-red-300 rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}