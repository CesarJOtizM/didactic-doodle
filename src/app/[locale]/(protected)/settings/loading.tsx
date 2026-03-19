import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Skeleton className="h-8 w-28 flex-1 rounded-md" />
        <Skeleton className="h-8 w-28 flex-1 rounded-md" />
      </div>

      {/* Settings form skeleton */}
      <div className="space-y-6 rounded-xl border border-border bg-card p-6">
        {/* File upload area */}
        <div className="rounded-lg border-2 border-dashed border-border p-8">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* Form fields */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}

        {/* Action button */}
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
