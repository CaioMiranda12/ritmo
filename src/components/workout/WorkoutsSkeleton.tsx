import { Skeleton } from '../ui/Skeleton'
import { Card } from '../ui/Card'

export function WorkoutsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-8 w-32" />
        </div>
        <Skeleton className="h-11 w-32 rounded-pill" />
      </div>

      <Skeleton className="h-36 w-full rounded-card" />

      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="mt-3 h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-28" />
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
