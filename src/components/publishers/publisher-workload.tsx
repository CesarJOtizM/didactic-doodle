'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PartType } from '@/generated/prisma/enums';

type PublisherWorkloadProps = {
  publisherId: string;
};

type WorkloadData = Partial<Record<PartType, number>>;

const MONTH_OPTIONS = ['1', '3', '6', '12'];

export function PublisherWorkload({ publisherId }: PublisherWorkloadProps) {
  const t = useTranslations('publishers');
  const [isPending, startTransition] = useTransition();
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [months, setMonths] = useState('3');

  const fetchWorkload = useCallback(() => {
    startTransition(async () => {
      const res = await fetch(
        `/api/publishers/${publisherId}/workload?months=${months}`
      );
      if (res.ok) {
        const data = await res.json();
        setWorkload(data);
      }
    });
  }, [publisherId, months, startTransition]);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  const total = workload
    ? Object.values(workload).reduce((sum, c) => sum + (c ?? 0), 0)
    : 0;

  const partTypes = Object.values(PartType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('detail.workloadTab')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('workload.months')}:
          </span>
          <Select value={months} onValueChange={(val) => val && setMonths(val)}>
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

        {/* Workload table */}
        {workload && total > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('history.type')}
                  </TableHead>
                  <TableHead className="h-9 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('workload.total')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partTypes.map((pt, index) => {
                  const count = workload[pt] ?? 0;
                  if (count === 0) return null;
                  return (
                    <TableRow
                      key={pt}
                      className={cn(
                        'transition-colors hover:bg-muted/50',
                        isPending && 'opacity-60',
                        index % 2 === 0 && 'bg-muted/30'
                      )}
                    >
                      <TableCell className="py-2 text-sm">{pt}</TableCell>
                      <TableCell className="py-2 text-right text-sm tabular-nums">
                        {count}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="border-t-2 border-border bg-muted/50 font-medium">
                  <TableCell className="py-2 text-sm">
                    {t('workload.total')}
                  </TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums">
                    {total}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {isPending ? '...' : t('empty.noWorkloadData')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
