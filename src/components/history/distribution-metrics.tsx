'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
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
import { PartType } from '@/generated/prisma/enums';
import type { WorkloadEntry } from '@/data/publishers';

type DistributionMetricsProps = {
  data: WorkloadEntry[];
  months: number;
};

const MONTH_OPTIONS = ['1', '3', '6', '12'];

function computeStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) };
}

function getCellClass(value: number, mean: number, stdDev: number): string {
  if (stdDev === 0 || value === 0) return '';
  if (value < mean - stdDev) return 'bg-orange-50 dark:bg-orange-950/20';
  if (value > mean + stdDev) return 'bg-blue-50 dark:bg-blue-950/20';
  return '';
}

export function DistributionMetrics({
  data,
  months,
}: DistributionMetricsProps) {
  const t = useTranslations('history');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const partTypes = Object.values(PartType);

  // Compute column stats
  const columnStats = new Map<string, { mean: number; stdDev: number }>();
  for (const pt of partTypes) {
    const values = data.map((d) => d.counts[pt] ?? 0);
    columnStats.set(pt, computeStats(values));
  }
  const totalValues = data.map((d) => d.total);
  const totalStats = computeStats(totalValues);

  const handleMonthsChange = useCallback(
    (val: string | null) => {
      if (!val) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'metrics');
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
          {t('metrics.months')}:
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
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded bg-orange-50 ring-1 ring-orange-200 dark:bg-orange-950/20 dark:ring-orange-800" />
          {t('metrics.underUtilized')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/20 dark:ring-blue-800" />
          {t('metrics.overUtilized')}
        </span>
      </div>

      {/* Table */}
      {data.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('metrics.publisher')}</TableHead>
              {partTypes.map((pt) => (
                <TableHead key={pt} className="text-center">
                  {t(`partType.${pt}`)}
                </TableHead>
              ))}
              <TableHead className="text-center">
                {t('metrics.total')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.publisherId}>
                <TableCell className="font-medium">
                  {entry.publisherNombre}
                </TableCell>
                {partTypes.map((pt) => {
                  const count = entry.counts[pt] ?? 0;
                  const stats = columnStats.get(pt)!;
                  return (
                    <TableCell
                      key={pt}
                      className={`text-center ${getCellClass(count, stats.mean, stats.stdDev)}`}
                    >
                      {count || '—'}
                    </TableCell>
                  );
                })}
                <TableCell
                  className={`text-center font-medium ${getCellClass(entry.total, totalStats.mean, totalStats.stdDev)}`}
                >
                  {entry.total}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {t('empty.noMetrics')}
          </p>
        </div>
      )}
    </div>
  );
}
