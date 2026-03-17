import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import {
  getPublishers,
  checkAndReactivateAbsentPublishers,
} from '@/data/publishers';
import { publisherFilterSchema } from '@/lib/schemas/publisher';
import { PublisherList } from '@/components/publishers/publisher-list';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BarChart3Icon } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublishersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('publishers');
  const rawParams = await searchParams;

  // Auto-reactivate ABSENT publishers with expired fechaFinAusencia (D6)
  await checkAndReactivateAbsentPublishers();

  // Parse and validate filters from URL search params
  const filterResult = publisherFilterSchema.safeParse(rawParams);
  const filters = filterResult.success
    ? filterResult.data
    : {
        sortBy: 'nombre' as const,
        sortOrder: 'asc' as const,
        page: 1,
        pageSize: 20,
      };

  const result = await getPublishers(filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/publishers/workload" />}
        >
          <BarChart3Icon className="size-4" data-icon="inline-start" />
          {t('workloadOverview')}
        </Button>
      </div>
      <PublisherList
        publishers={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        filters={filters}
      />
    </div>
  );
}
