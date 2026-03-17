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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.date')}</TableHead>
            <TableHead>{t('table.week')}</TableHead>
            <TableHead>{t('table.section')}</TableHead>
            <TableHead>{t('table.type')}</TableHead>
            <TableHead>{t('table.title')}</TableHead>
            <TableHead>{t('table.room')}</TableHead>
            <TableHead>{t('table.titular')}</TableHead>
            <TableHead>{t('table.helper')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(entry.fecha).toLocaleDateString()}
              </TableCell>
              <TableCell>{entry.semana}</TableCell>
              <TableCell>{t(`section.${entry.seccion}`)}</TableCell>
              <TableCell>{t(`partType.${entry.tipo}`)}</TableCell>
              <TableCell>{entry.titulo ?? '—'}</TableCell>
              <TableCell>{t(`room.${entry.sala}`)}</TableCell>
              <TableCell className="font-medium">
                {entry.publisherNombre}
              </TableCell>
              <TableCell>{entry.helperNombre ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('pagination.showing')} {(page - 1) * 20 + 1} {t('pagination.to')}{' '}
            {Math.min(page * 20, total)} {t('pagination.of')} {total}{' '}
            {t('pagination.results')}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeftIcon className="size-4" data-icon="inline-start" />
              {t('pagination.previous')}
            </Button>
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
