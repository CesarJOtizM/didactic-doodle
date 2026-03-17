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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('lastAssignment.publisher')}</TableHead>
          <TableHead>{t('lastAssignment.date')}</TableHead>
          <TableHead>{t('lastAssignment.section')}</TableHead>
          <TableHead>{t('lastAssignment.type')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry) => {
          const days = daysSince(entry.lastDate);
          const isNever = entry.lastDate === null;

          return (
            <TableRow
              key={entry.publisherId}
              className={isNever ? 'bg-orange-50 dark:bg-orange-950/20' : ''}
            >
              <TableCell className="font-medium">
                {entry.publisherNombre}
              </TableCell>
              <TableCell>
                {isNever ? (
                  <span className="text-orange-600 dark:text-orange-400">
                    {t('lastAssignment.never')}
                  </span>
                ) : (
                  <span>
                    {new Date(entry.lastDate!).toLocaleDateString()}
                    {days !== null && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({t('lastAssignment.daysAgo', { days })})
                      </span>
                    )}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {entry.lastSeccion ? t(`section.${entry.lastSeccion}`) : '—'}
              </TableCell>
              <TableCell>
                {entry.lastTipo ? t(`partType.${entry.lastTipo}`) : '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
