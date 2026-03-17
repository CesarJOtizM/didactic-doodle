'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { WeekStatus } from '@/generated/prisma/enums';

const statusStyles: Record<WeekStatus, string> = {
  [WeekStatus.DRAFT]:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  [WeekStatus.ASSIGNED]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [WeekStatus.PUBLISHED]:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
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
