'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS = ['history', 'metrics', 'last-assignment'] as const;
type Tab = (typeof TABS)[number];

type HistoryTabsProps = {
  activeTab: Tab;
};

export function HistoryTabs({ activeTab }: HistoryTabsProps) {
  const t = useTranslations('history');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams();
      params.set('tab', tab);
      // Preserve months for metrics tab
      if (tab === 'metrics') {
        const months = searchParams.get('months');
        if (months) params.set('months', months);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => handleTabChange(value as Tab)}
    >
      <TabsList>
        <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
        <TabsTrigger value="metrics">{t('tabs.metrics')}</TabsTrigger>
        <TabsTrigger value="last-assignment">
          {t('tabs.lastAssignment')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
