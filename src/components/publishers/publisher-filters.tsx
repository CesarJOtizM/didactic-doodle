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
import { XIcon, SearchIcon, CheckCircleIcon } from 'lucide-react';

type PublisherFiltersProps = {
  filters: {
    search?: string;
    sexo?: string;
    rol?: string;
    estado?: string;
    habilitadoVMC?: boolean;
    habilitadoOracion?: boolean;
    habilitadoLectura?: boolean;
    habilitadoAcomodador?: boolean;
    habilitadoMicrofono?: boolean;
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
    filters.search ||
    filters.sexo ||
    filters.rol ||
    filters.estado ||
    filters.habilitadoVMC ||
    filters.habilitadoOracion ||
    filters.habilitadoLectura ||
    filters.habilitadoAcomodador ||
    filters.habilitadoMicrofono;

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
            <SelectValue placeholder={t('filter.allGenders')}>
              {(value: string) =>
                value ? t(`gender.${value}`) : t('filter.allGenders')
              }
            </SelectValue>
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
            <SelectValue placeholder={t('filter.allRoles')}>
              {(value: string) =>
                value ? t(`role.${value}`) : t('filter.allRoles')
              }
            </SelectValue>
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
            <SelectValue placeholder={t('filter.allStatuses')}>
              {(value: string) =>
                value ? t(`status.${value}`) : t('filter.allStatuses')
              }
            </SelectValue>
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

        {/* Habilitación toggles */}
        <div className="flex items-center gap-1">
          <HabilitacionToggle
            label={t('table.vmcEnabled')}
            active={filters.habilitadoVMC === true}
            onClick={() =>
              updateParam(
                'habilitadoVMC',
                filters.habilitadoVMC ? undefined : 'true'
              )
            }
          />
          <HabilitacionToggle
            label={t('form.prayerEnabled')}
            active={filters.habilitadoOracion === true}
            onClick={() =>
              updateParam(
                'habilitadoOracion',
                filters.habilitadoOracion ? undefined : 'true'
              )
            }
          />
          <HabilitacionToggle
            label={t('table.readerEnabled')}
            active={filters.habilitadoLectura === true}
            onClick={() =>
              updateParam(
                'habilitadoLectura',
                filters.habilitadoLectura ? undefined : 'true'
              )
            }
          />
          <HabilitacionToggle
            label={t('table.attendantEnabled')}
            active={filters.habilitadoAcomodador === true}
            onClick={() =>
              updateParam(
                'habilitadoAcomodador',
                filters.habilitadoAcomodador ? undefined : 'true'
              )
            }
          />
          <HabilitacionToggle
            label={t('table.microphoneEnabled')}
            active={filters.habilitadoMicrofono === true}
            onClick={() =>
              updateParam(
                'habilitadoMicrofono',
                filters.habilitadoMicrofono ? undefined : 'true'
              )
            }
          />
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy ?? 'nombre'}
          onValueChange={(val) => updateParam('sortBy', val ?? undefined)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue>
              {(value: string) => {
                const sortLabels: Record<string, string> = {
                  nombre: t('sort.sortByName'),
                  ultimaAsignacion: t('sort.sortByLastAssignment'),
                  totalAsignaciones: t('sort.sortByTotalAssignments'),
                };
                return sortLabels[value] ?? t('sort.sortByName');
              }}
            </SelectValue>
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

// ─── Toggle button for habilitación filters ──────────────────────────

function HabilitacionToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="h-9 gap-1 text-xs"
    >
      {active && <CheckCircleIcon className="size-3" />}
      {label}
    </Button>
  );
}
