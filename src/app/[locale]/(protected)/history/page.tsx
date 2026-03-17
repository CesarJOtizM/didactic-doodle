import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { historyFilterSchema } from '@/lib/schemas/history';
import {
  getGlobalHistory,
  getGlobalDistribution,
  getLastAssignments,
} from '@/data/history';
import { HistoryTabs } from '@/components/history/history-tabs';
import { HistoryFilters } from '@/components/history/history-filters';
import { HistoryTable } from '@/components/history/history-table';
import { DistributionMetrics } from '@/components/history/distribution-metrics';
import { LastAssignmentTable } from '@/components/history/last-assignment-table';
import type { PartType, Section } from '@/generated/prisma/enums';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HistoryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('history');
  const rawParams = await searchParams;

  // Parse filters from URL
  const filterResult = historyFilterSchema.safeParse(rawParams);
  const filters = filterResult.success
    ? filterResult.data
    : {
        tab: 'history' as const,
        months: 3,
        page: 1,
        pageSize: 20,
      };

  const activeTab = filters.tab;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

      <HistoryTabs activeTab={activeTab} />

      {activeTab === 'history' && <HistoryTabContent filters={filters} />}

      {activeTab === 'metrics' && <MetricsTabContent months={filters.months} />}

      {activeTab === 'last-assignment' && <LastAssignmentTabContent />}
    </div>
  );
}

// ─── Tab Content Components (async RSC) ──────────────────────────────

async function HistoryTabContent({
  filters,
}: {
  filters: {
    search?: string;
    tipo?: string;
    seccion?: string;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    pageSize: number;
  };
}) {
  const result = await getGlobalHistory({
    search: filters.search,
    tipo: filters.tipo as PartType | undefined,
    seccion: filters.seccion as Section | undefined,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  return (
    <>
      <HistoryFilters
        search={filters.search}
        tipo={filters.tipo}
        seccion={filters.seccion}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
      />
      <HistoryTable
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
      />
    </>
  );
}

async function MetricsTabContent({ months }: { months: number }) {
  const data = await getGlobalDistribution(months);

  return <DistributionMetrics data={data} months={months} />;
}

async function LastAssignmentTabContent() {
  const data = await getLastAssignments();

  return <LastAssignmentTable data={data} />;
}
