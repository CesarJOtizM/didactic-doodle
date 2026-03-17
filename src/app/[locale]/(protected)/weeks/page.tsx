import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getMeetingWeeks } from '@/data/meeting-weeks';
import { meetingWeekFilterSchema } from '@/lib/schemas/meeting-week';
import { WeekList } from '@/components/weeks/week-list';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>
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
