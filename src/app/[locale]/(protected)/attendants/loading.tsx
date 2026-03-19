import { Skeleton } from '@/components/ui/skeleton';

export default function AttendantsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header with action button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Card grid — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card shadow-sm"
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            {/* Card content — 4 role rows */}
            <div className="space-y-0.5 px-6 pb-6">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between rounded-md px-3 py-2"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
