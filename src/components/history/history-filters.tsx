'use client';

import { useCallback } from 'react';
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
import { XIcon } from 'lucide-react';
import { PartType, Section } from '@/generated/prisma/enums';

type HistoryFiltersProps = {
  search?: string;
  tipo?: string;
  seccion?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function HistoryFilters({
  search,
  tipo,
  seccion,
  dateFrom,
  dateTo,
}: HistoryFiltersProps) {
  const t = useTranslations('history');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'history');
      params.set('page', '1'); // Reset page on filter change
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(`${pathname}?tab=history`);
  }, [router, pathname]);

  const hasFilters = search || tipo || seccion || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="search"
        placeholder={t('filter.search')}
        defaultValue={search ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          // Debounce via setTimeout could be added, but for simplicity
          // we update on change. If needed, wrap with useDeferredValue
          updateParam('search', val || null);
        }}
        className="w-56"
      />

      <Select
        value={tipo ?? ''}
        onValueChange={(val) => updateParam('tipo', val || null)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t('filter.filterByType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t('filter.allTypes')}</SelectItem>
          {Object.values(PartType).map((pt) => (
            <SelectItem key={pt} value={pt}>
              {t(`partType.${pt}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={seccion ?? ''}
        onValueChange={(val) => updateParam('seccion', val || null)}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder={t('filter.filterBySection')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t('filter.allSections')}</SelectItem>
          {Object.values(Section).map((s) => (
            <SelectItem key={s} value={s}>
              {t(`section.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={dateFrom ?? ''}
        onChange={(e) => updateParam('dateFrom', e.target.value || null)}
        className="w-40"
      />
      <Input
        type="date"
        value={dateTo ?? ''}
        onChange={(e) => updateParam('dateTo', e.target.value || null)}
        className="w-40"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <XIcon className="size-4" data-icon="inline-start" />
          {t('filter.clearFilters')}
        </Button>
      )}
    </div>
  );
}
