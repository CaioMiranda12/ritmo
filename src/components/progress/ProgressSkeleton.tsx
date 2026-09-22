import { Skeleton } from '../ui/Skeleton'
import { Card } from '../ui/Card'

export function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-8 w-44" />
        </div>
        <Skeleton className="h-11 w-40 rounded-pill" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>

      <Card>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>

      <div>
        <Skeleton className="mb-3 h-6 w-40" />
        <Card padding="none" className="divide-y divide-border px-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
