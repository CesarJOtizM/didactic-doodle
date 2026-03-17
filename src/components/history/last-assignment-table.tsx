'use client';

import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { LastAssignmentEntry } from '@/data/history';

type LastAssignmentTableProps = {
  data: LastAssignmentEntry[];
};

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function LastAssignmentTable({ data }: LastAssignmentTableProps) {
  const t = useTranslations('history');

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          {t('empty.noLastAssignment')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('lastAssignment.publisher')}
            </TableHead>
            <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('lastAssignment.date')}
            </TableHead>
            <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('lastAssignment.section')}
            </TableHead>
            <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('lastAssignment.type')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => {
            const days = daysSince(entry.lastDate);
            const isNever = entry.lastDate === null;

            return (
              <TableRow
                key={entry.publisherId}
                className={cn(
                  'transition-colors hover:bg-muted/50',
                  index % 2 === 0 && 'bg-muted/30',
                  isNever && 'bg-orange-50 dark:bg-orange-950/20'
                )}
              >
                <TableCell className="py-2.5 font-medium">
                  {entry.publisherNombre}
                </TableCell>
                <TableCell className="py-2.5">
                  {isNever ? (
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {t('lastAssignment.never')}
                    </span>
                  ) : (
                    <span className="text-sm">
                      {new Date(entry.lastDate!).toLocaleDateString()}
                      {days !== null && (
                        <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                          ({t('lastAssignment.daysAgo', { days })})
                        </span>
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2.5 text-sm text-muted-foreground">
                  {entry.lastSeccion ? t(`section.${entry.lastSeccion}`) : '—'}
                </TableCell>
                <TableCell className="py-2.5 text-sm text-muted-foreground">
                  {entry.lastTipo ? t(`partType.${entry.lastTipo}`) : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
