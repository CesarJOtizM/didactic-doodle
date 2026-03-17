'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { PublisherStatus } from '@/generated/prisma/enums';
import { cn } from '@/lib/utils';

const statusConfig: Record<PublisherStatus, { dot: string; badge: string }> = {
  [PublisherStatus.ACTIVE]: {
    dot: 'bg-emerald-500',
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  [PublisherStatus.ABSENT]: {
    dot: 'bg-amber-500',
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  },
  [PublisherStatus.RESTRICTED]: {
    dot: 'bg-orange-500',
    badge:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400',
  },
  [PublisherStatus.INACTIVE]: {
    dot: 'bg-slate-400',
    badge:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400',
  },
};

type PublisherStatusBadgeProps = {
  status: PublisherStatus;
};

export function PublisherStatusBadge({ status }: PublisherStatusBadgeProps) {
  const t = useTranslations('publishers');
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.badge
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', config.dot)}
        aria-hidden="true"
      />
      {t(`status.${status}`)}
    </Badge>
  );
}
