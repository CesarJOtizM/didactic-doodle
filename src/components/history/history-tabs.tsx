'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

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
    <div className="inline-flex h-8 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabChange(tab)}
          className={cn(
            'inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md px-3 py-0.5 text-sm font-medium whitespace-nowrap transition-all',
            activeTab === tab
              ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30'
              : 'text-foreground/60 hover:text-foreground'
          )}
        >
          {t(`tabs.${tab === 'last-assignment' ? 'lastAssignment' : tab}`)}
        </button>
      ))}
    </div>
  );
}
