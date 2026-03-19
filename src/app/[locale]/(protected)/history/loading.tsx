import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>

      {/* Filter panel */}
      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-full sm:min-w-[180px] sm:w-auto sm:flex-1" />
          <Skeleton className="h-9 w-full sm:min-w-[140px] sm:w-auto sm:flex-1" />
          <Skeleton className="h-9 w-full sm:min-w-[140px] sm:w-auto sm:flex-1" />
          <Skeleton className="h-9 w-full sm:min-w-[140px] sm:w-auto sm:flex-1" />
          <Skeleton className="h-9 w-full sm:min-w-[140px] sm:w-auto sm:flex-1" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        {/* Header */}
        <div className="flex items-center gap-4 bg-muted/50 px-4 py-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-t border-border px-4 py-3"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
