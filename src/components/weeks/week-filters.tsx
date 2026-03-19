'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { WeekStatus } from '@/generated/prisma/enums';
import { XIcon } from 'lucide-react';

type WeekFiltersProps = {
  filters: {
    status?: string;
  };
};

export function WeekFilters({ filters }: WeekFiltersProps) {
  const t = useTranslations('meetings');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasActiveFilters = !!filters.status;

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <Select
          value={filters.status ?? ''}
          onValueChange={(val) => updateParam('status', val || undefined)}
        >
          <SelectTrigger className="h-9 w-full sm:min-w-[160px] sm:w-auto sm:flex-1">
            <SelectValue placeholder={t('filter.allStatuses')}>
              {(value: string) =>
                value ? t(`status.${value}`) : t('filter.allStatuses')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('filter.allStatuses')}</SelectItem>
            {Object.values(WeekStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" data-icon="inline-start" />
          </Button>
        )}
      </div>
    </div>
  );
}
