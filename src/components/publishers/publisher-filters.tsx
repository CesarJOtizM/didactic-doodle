'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Gender, Role, PublisherStatus } from '@/generated/prisma/enums';
import { XIcon, SearchIcon } from 'lucide-react';

type PublisherFiltersProps = {
  filters: {
    search?: string;
    sexo?: string;
    rol?: string;
    estado?: string;
    sortBy?: string;
    sortOrder?: string;
  };
};

export function PublisherFilters({ filters }: PublisherFiltersProps) {
  const t = useTranslations('publishers');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.search ?? '');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('search', searchValue || undefined);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
      if (key !== 'page') {
        params.delete('page');
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchValue('');
    router.push(pathname);
  }, [router, pathname]);

  const hasActiveFilters =
    filters.search || filters.sexo || filters.rol || filters.estado;

  return (
    <div className="w-full rounded-lg border border-border bg-muted/50 p-3">
      {/* Search — full width on mobile */}
      <div className="relative mb-3 w-full">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('filter.search')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-10 w-full pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Gender filter */}
        <Select
          value={filters.sexo ?? ''}
          onValueChange={(val) => updateParam('sexo', val ?? undefined)}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder={t('filter.allGenders')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('filter.allGenders')}</SelectItem>
            {Object.values(Gender).map((g) => (
              <SelectItem key={g} value={g}>
                {t(`gender.${g}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role filter */}
        <Select
          value={filters.rol ?? ''}
          onValueChange={(val) => updateParam('rol', val ?? undefined)}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder={t('filter.allRoles')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('filter.allRoles')}</SelectItem>
            {Object.values(Role).map((r) => (
              <SelectItem key={r} value={r}>
                {t(`role.${r}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={filters.estado ?? ''}
          onValueChange={(val) => updateParam('estado', val ?? undefined)}
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder={t('filter.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('filter.allStatuses')}</SelectItem>
            {Object.values(PublisherStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sortBy ?? 'nombre'}
          onValueChange={(val) => updateParam('sortBy', val ?? undefined)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre">{t('sort.sortByName')}</SelectItem>
            <SelectItem value="ultimaAsignacion">
              {t('sort.sortByLastAssignment')}
            </SelectItem>
            <SelectItem value="totalAsignaciones">
              {t('sort.sortByTotalAssignments')}
            </SelectItem>
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
            {t('filter.clearFilters')}
          </Button>
        )}
      </div>
    </div>
  );
}
