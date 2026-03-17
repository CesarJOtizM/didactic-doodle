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
    <div className="flex gap-0 border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabChange(tab)}
          className={cn(
            '-mb-px inline-flex items-center justify-center border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
            activeTab === tab
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
          )}
        >
          {t(`tabs.${tab === 'last-assignment' ? 'lastAssignment' : tab}`)}
        </button>
      ))}
    </div>
  );
}
