'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { PublisherStatus } from '@/generated/prisma/enums';

const statusStyles: Record<PublisherStatus, string> = {
  [PublisherStatus.ACTIVE]:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [PublisherStatus.ABSENT]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  [PublisherStatus.RESTRICTED]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  [PublisherStatus.INACTIVE]:
    'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
};

type PublisherStatusBadgeProps = {
  status: PublisherStatus;
};

export function PublisherStatusBadge({ status }: PublisherStatusBadgeProps) {
  const t = useTranslations('publishers');

  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {t(`status.${status}`)}
    </Badge>
  );
}
