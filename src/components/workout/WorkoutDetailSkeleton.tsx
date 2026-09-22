import { Skeleton } from '../ui/Skeleton'
import { Card } from '../ui/Card'

export function WorkoutDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-20" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-2 h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-32 rounded-pill" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-pill" />
        <Skeleton className="h-9 w-24 rounded-pill" />
      </div>

      <Card padding="none" className="px-5 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-border py-4 last:border-b-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </Card>
    </div>
  )
}
