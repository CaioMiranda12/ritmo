import { Skeleton } from '../ui/Skeleton'
import { Card } from '../ui/Card'

export function DietSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-8 w-40" />
      </div>

      <Skeleton className="h-28 w-full rounded-card" />

      <Card padding="none" className="divide-y divide-border px-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </Card>

      <Skeleton className="h-32 w-full rounded-card" />
    </div>
  )
}
