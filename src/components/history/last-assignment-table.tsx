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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    <>
      {/* ── Mobile Card View ── */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {data.map((entry) => {
          const days = daysSince(entry.lastDate);
          const isNever = entry.lastDate === null;

          return (
            <Card
              key={entry.publisherId}
              size="sm"
              className={cn(isNever && 'ring-orange-200 dark:ring-orange-800')}
            >
              <CardHeader className="flex-row items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {entry.publisherNombre}
                </span>
                {isNever ? (
                  <Badge variant="destructive" className="text-xs">
                    {t('lastAssignment.never')}
                  </Badge>
                ) : (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {new Date(entry.lastDate!).toLocaleDateString()}
                    {days !== null && (
                      <span className="ml-1">
                        ({t('lastAssignment.daysAgo', { days })})
                      </span>
                    )}
                  </span>
                )}
              </CardHeader>
              {(entry.lastSeccion || entry.lastTipo) && (
                <CardContent>
                  <div className="flex items-center gap-1.5">
                    {entry.lastSeccion && (
                      <Badge variant="secondary" className="text-xs">
                        {t(`section.${entry.lastSeccion}`)}
                      </Badge>
                    )}
                    {entry.lastTipo && (
                      <Badge variant="outline" className="text-xs">
                        {t(`partType.${entry.lastTipo}`)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Desktop Table View ── */}
      <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
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
                    {entry.lastSeccion
                      ? t(`section.${entry.lastSeccion}`)
                      : '—'}
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
    </>
  );
}
