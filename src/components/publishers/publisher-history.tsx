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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PartType } from '@/generated/prisma/enums';
import type { AssignmentHistory } from '@/generated/prisma/client';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

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
              <SelectValue placeholder={t('history.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('history.filterByType')}</SelectItem>
              {Object.values(PartType).map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {pt}
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
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('empty.noHistory')}
          </p>
        ) : history && history.data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.date')}</TableHead>
                  <TableHead>{t('history.section')}</TableHead>
                  <TableHead>{t('history.type')}</TableHead>
                  <TableHead>{t('history.title')}</TableHead>
                  <TableHead>{t('history.room')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={isPending ? 'opacity-60' : ''}
                  >
                    <TableCell>
                      {new Date(entry.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{entry.seccion}</TableCell>
                    <TableCell>{entry.tipo}</TableCell>
                    <TableCell>{entry.titulo ?? '—'}</TableCell>
                    <TableCell>{entry.sala}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {history.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('pagination.page')} {history.page} {t('pagination.of')}{' '}
                  {history.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isPending}
                    onClick={() => setPage((p) => p - 1)}
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
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('empty.noHistory')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
