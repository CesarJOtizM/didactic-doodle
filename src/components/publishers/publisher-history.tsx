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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PartType } from '@/generated/prisma/enums';
import type { AssignmentHistory } from '@/generated/prisma/client';
import { ChevronLeftIcon, ChevronRightIcon, HistoryIcon } from 'lucide-react';

type PublisherHistoryProps = {
  publisherId: string;
};

type HistoryResponse = {
  data: AssignmentHistory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function PublisherHistory({ publisherId }: PublisherHistoryProps) {
  const t = useTranslations('publishers');
  const th = useTranslations('history');
  const tMeetings = useTranslations('meetings');
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [tipo, setTipo] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(() => {
    startTransition(async () => {
      const params = new URLSearchParams();
      params.set('publisherId', publisherId);
      params.set('page', String(page));
      if (tipo) params.set('tipo', tipo);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(
        `/api/publishers/${publisherId}/history?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    });
  }, [publisherId, page, tipo, dateFrom, dateTo, startTransition]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTipoChange = (val: string | null) => {
    setTipo(val ?? '');
    setPage(1);
  };

  /** Translate titulo: fixed parts store i18n keys, dynamic parts store plain text */
  const translateTitulo = useCallback(
    (titulo: string | null): string => {
      if (!titulo) return '—';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('detail.historyTab')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tipo} onValueChange={handleTipoChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('history.filterByType')}>
                {(value: string) =>
                  value ? th(`partType.${value}`) : t('history.filterByType')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('history.filterByType')}</SelectItem>
              {Object.values(PartType).map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {th(`partType.${pt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder={t('history.dateFrom')}
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          <Input
            type="date"
            placeholder={t('history.dateTo')}
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>

        {/* Table */}
        {isPending && !history ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <HistoryIcon className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t('empty.noHistory')}
            </p>
          </div>
        ) : history && history.data.length > 0 ? (
          <>
            {/* ── Mobile Card View ── */}
            <div className="grid grid-cols-1 gap-2 sm:hidden">
              {history.data.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-lg border border-border p-3 space-y-1.5',
                    isPending && 'opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {new Date(entry.fecha).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {th(`room.${entry.sala}`)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {th(`section.${entry.seccion}`)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {th(`partType.${entry.tipo}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {translateTitulo(entry.titulo)}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Desktop Table View ── */}
            <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('history.date')}
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('history.section')}
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('history.type')}
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('history.title')}
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('history.room')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.data.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        'transition-colors hover:bg-muted/50',
                        isPending && 'opacity-60',
                        index % 2 === 0 && 'bg-muted/30'
                      )}
                    >
                      <TableCell className="py-2 text-sm tabular-nums">
                        {new Date(entry.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2 text-sm">
                        {th(`section.${entry.seccion}`)}
                      </TableCell>
                      <TableCell className="py-2 text-sm">
                        {th(`partType.${entry.tipo}`)}
                      </TableCell>
                      <TableCell className="py-2 text-sm">
                        {translateTitulo(entry.titulo)}
                      </TableCell>
                      <TableCell className="py-2 text-sm">
                        {th(`room.${entry.sala}`)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {history.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">
                  {t('pagination.page')}{' '}
                  <span className="font-medium text-foreground">
                    {history.page}
                  </span>{' '}
                  {t('pagination.of')}{' '}
                  <span className="font-medium text-foreground">
                    {history.totalPages}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isPending}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-9"
                  >
                    <ChevronLeftIcon
                      className="size-4"
                      data-icon="inline-start"
                    />
                    {t('pagination.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= history.totalPages || isPending}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9"
                  >
                    {t('pagination.next')}
                    <ChevronRightIcon
                      className="size-4"
                      data-icon="inline-end"
                    />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <HistoryIcon className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t('empty.noHistory')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
