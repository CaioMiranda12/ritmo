import { Skeleton } from '../ui/Skeleton'
import { Card } from '../ui/Card'

export function TodaySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-8 w-56" />
      </div>

      <Skeleton className="h-24 w-full rounded-card" />
      <Skeleton className="h-64 w-full rounded-card" />

      <div>
        <Skeleton className="mb-3 h-6 w-48" />
        <Card padding="none" className="divide-y divide-border px-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Skeleton className="h-40 w-full rounded-card" />
    </div>
  )
}
