'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

type PublisherPaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function PublisherPagination({
  total,
  page,
  pageSize,
  totalPages,
}: PublisherPaginationProps) {
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
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {t('pagination.showing')}{' '}
        <span className="font-medium text-foreground">{from}</span>{' '}
        {t('pagination.to')}{' '}
        <span className="font-medium text-foreground">{to}</span>{' '}
        {t('pagination.of')}{' '}
        <span className="font-medium text-foreground">{total}</span>{' '}
        {t('pagination.results')}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className="h-9"
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
          className="h-9"
        >
          {t('pagination.next')}
          <ChevronRightIcon className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
