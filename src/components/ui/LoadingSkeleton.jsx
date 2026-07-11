export default function LoadingSkeleton({ type = 'cards' }) {
  if (type === 'cards') {
    return (
      <div className="flex flex-wrap gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-1 min-w-40 h-36 bg-slate-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  if (type === 'charts') {
    return (
      <div className="grid grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-72 bg-slate-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-slate-200 animate-pulse rounded-xl" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  return null
}