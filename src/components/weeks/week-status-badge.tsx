'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { WeekStatus } from '@/generated/prisma/enums';

const statusStyles: Record<WeekStatus, string> = {
  [WeekStatus.DRAFT]:
    'bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400',
  [WeekStatus.ASSIGNED]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [WeekStatus.PUBLISHED]:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

type WeekStatusBadgeProps = {
  status: WeekStatus;
};

export function WeekStatusBadge({ status }: WeekStatusBadgeProps) {
  const t = useTranslations('meetings');

  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {t(`status.${status}`)}
    </Badge>
  );
}
