'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PartType } from '@/generated/prisma/enums';
import type { WorkloadEntry } from '@/data/publishers';
import { BarChart3Icon } from 'lucide-react';

type WorkloadOverviewProps = {
  data: WorkloadEntry[];
  months: number;
};

const MONTH_OPTIONS = ['1', '3', '6', '12'];

/**
 * Compute mean and standard deviation for an array of numbers.
 */
function computeStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * Determine cell class based on utilization thresholds.
 */
function getCellClass(value: number, mean: number, stdDev: number): string {
  if (stdDev === 0 || value === 0) return '';
  if (value < mean - stdDev)
    return 'bg-orange-100/70 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300';
  if (value > mean + stdDev)
    return 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300';
  return '';
}

export function WorkloadOverview({ data, months }: WorkloadOverviewProps) {
  const t = useTranslations('publishers');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const partTypes = Object.values(PartType);

  // Compute column stats for each PartType
  const columnStats = new Map<string, { mean: number; stdDev: number }>();
  for (const pt of partTypes) {
    const values = data.map((d) => d.counts[pt] ?? 0);
    columnStats.set(pt, computeStats(values));
  }

  // Also compute total stats
  const totalValues = data.map((d) => d.total);
  const totalStats = computeStats(totalValues);

  const handleMonthsChange = useCallback(
    (val: string | null) => {
      if (!val) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('months', val);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {t('workload.months')}:
        </span>
        <Select value={String(months)} onValueChange={handleMonthsChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-orange-100 ring-1 ring-orange-300 dark:bg-orange-950/30 dark:ring-orange-700" />
          {t('workload.underUtilized')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-muted ring-1 ring-border" />
          {t('workload.normal')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-blue-100 ring-1 ring-blue-300 dark:bg-blue-950/30 dark:ring-blue-700" />
          {t('workload.overUtilized')}
        </span>
      </div>

      {/* Table */}
      {data.length > 0 ? (
        <div className="overflow-x-auto overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('workload.publisher')}
                </TableHead>
                {partTypes.map((pt) => (
                  <TableHead
                    key={pt}
                    className="h-9 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {pt}
                  </TableHead>
                ))}
                <TableHead className="h-9 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('workload.total')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry, index) => (
                <TableRow
                  key={entry.publisherId}
                  className={cn(
                    'transition-colors hover:bg-muted/50',
                    index % 2 === 0 && 'bg-muted/30'
                  )}
                >
                  <TableCell className="py-2">
                    <Link
                      href={`/publishers/${entry.publisherId}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {entry.publisherNombre}
                    </Link>
                  </TableCell>
                  {partTypes.map((pt) => {
                    const count = entry.counts[pt] ?? 0;
                    const stats = columnStats.get(pt)!;
                    return (
                      <TableCell
                        key={pt}
                        className={cn(
                          'py-2 text-center text-sm tabular-nums',
                          getCellClass(count, stats.mean, stats.stdDev)
                        )}
                      >
                        {count || '—'}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    className={cn(
                      'py-2 text-center text-sm font-medium tabular-nums',
                      getCellClass(
                        entry.total,
                        totalStats.mean,
                        totalStats.stdDev
                      )
                    )}
                  >
                    {entry.total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <BarChart3Icon className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">
            {t('empty.noWorkloadData')}
          </p>
        </div>
      )}
    </div>
  );
}
