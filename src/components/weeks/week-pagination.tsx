'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

type WeekPaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function WeekPagination({
  total,
  page,
  pageSize,
  totalPages,
}: WeekPaginationProps) {
  const t = useTranslations('publishers');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
        params.set('page', String(newPage));
      } else {
        params.delete('page');
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">
        {t('pagination.showing')} {from} {t('pagination.to')} {to}{' '}
        {t('pagination.of')} {total} {t('pagination.results')}
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
  );
}
