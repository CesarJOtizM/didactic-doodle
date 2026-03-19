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
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AssignmentHistory } from '@/generated/prisma/client';

type HistoryTableProps = {
  data: AssignmentHistory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function HistoryTable({
  data,
  total,
  page,
  totalPages,
}: HistoryTableProps) {
  const t = useTranslations('history');
  const tMeetings = useTranslations('meetings');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Translate titulo: fixed parts store i18n keys, dynamic parts store plain text */
  const translateTitulo = useCallback(
    (titulo: string | null): string => {
      if (!titulo) return '—';
      // Fixed parts have keys like "meetings.parts.closingPrayer"
      if (titulo.startsWith('meetings.parts.')) {
        const partKey = titulo.replace('meetings.', '') as Parameters<
          typeof tMeetings
        >[0];
        return tMeetings(partKey);
      }
      return titulo;
    },
    [tMeetings]
  );

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          {t('empty.noHistory')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('empty.noHistoryDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Mobile Card View ── */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {data.map((entry) => (
          <Card key={entry.id} size="sm">
            <CardHeader className="flex-row items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {entry.publisherNombre}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {new Date(entry.fecha).toLocaleDateString()}
              </span>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {t(`section.${entry.seccion}`)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {t(`partType.${entry.tipo}`)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {t(`room.${entry.sala}`)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {translateTitulo(entry.titulo)}
              </p>
              {entry.helperNombre && (
                <p className="text-xs text-muted-foreground">
                  {t('table.helper')}: {entry.helperNombre}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Desktop Table View ── */}
      <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.date')}
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.week')}
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.section')}
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.type')}
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.title')}
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.room')}
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.titular')}
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('table.helper')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, index) => (
              <TableRow
                key={entry.id}
                className={cn(
                  'transition-colors hover:bg-muted/50',
                  index % 2 === 0 && 'bg-muted/30'
                )}
              >
                <TableCell className="py-2.5 whitespace-nowrap">
                  {new Date(entry.fecha).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-2.5 text-sm text-muted-foreground">
                  {entry.semana}
                </TableCell>
                <TableCell className="py-2.5 text-sm">
                  {t(`section.${entry.seccion}`)}
                </TableCell>
                <TableCell className="py-2.5 text-sm">
                  {t(`partType.${entry.tipo}`)}
                </TableCell>
                <TableCell className="py-2.5 text-sm">
                  {translateTitulo(entry.titulo)}
                </TableCell>
                <TableCell className="py-2.5 text-sm text-muted-foreground">
                  {t(`room.${entry.sala}`)}
                </TableCell>
                <TableCell className="py-2.5 font-medium">
                  {entry.publisherNombre}
                </TableCell>
                <TableCell className="py-2.5 text-sm text-muted-foreground">
                  {entry.helperNombre ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {t('pagination.showing')} {(page - 1) * 20 + 1} {t('pagination.to')}{' '}
            {Math.min(page * 20, total)} {t('pagination.of')} {total}{' '}
            {t('pagination.results')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeftIcon className="size-4" data-icon="inline-start" />
              {t('pagination.previous')}
            </Button>
            <span className="min-w-[4rem] text-center text-sm tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              {t('pagination.next')}
              <ChevronRightIcon className="size-4" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
