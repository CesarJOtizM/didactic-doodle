import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getMeetingWeeks } from '@/data/meeting-weeks';
import { meetingWeekFilterSchema } from '@/lib/schemas/meeting-week';
import { WeekList } from '@/components/weeks/week-list';
import { PageHeader } from '@/components/layout/page-header';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WeeksPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('meetings');
  const rawParams = await searchParams;

  // Parse and validate filters from URL search params
  const filterResult = meetingWeekFilterSchema.safeParse(rawParams);
  const filters = filterResult.success
    ? filterResult.data
    : { page: 1, pageSize: 20 };

  const result = await getMeetingWeeks(filters);

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <WeekList
        weeks={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        filters={filters}
      />
    </div>
  );
}
