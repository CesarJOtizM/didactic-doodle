import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMeetingWeeksByDateRange } from '@/data/meeting-weeks';
import { S140Program } from '@/components/print/s140-program';
import { WeekendProgram } from '@/components/print/weekend-program';
import { PrintButton } from '@/components/print/print-button';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    type?: 'midweek' | 'weekend';
  }>;
};

export default async function S140RangePrintPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { from, to, type = 'midweek' } = await searchParams;

  const [tPrint, tParts, tSections, tWeekend] = await Promise.all([
    getTranslations('meetings.print'),
    getTranslations('meetings.parts'),
    getTranslations('meetings.sections'),
    getTranslations('meetings.weekend'),
  ]);

  // Wrap typed translators into simple string functions
  const t = (key: string, values?: Record<string, string | number>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tPrint as any)(key, values) as string;
  const tp = (key: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tParts as any)(key) as string;
  const ts = (key: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tSections as any)(key) as string;
  const tw = (key: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tWeekend as any)(key) as string;

  // Parse date range
  if (!from || !to) {
    return (
      <div className="p-8 text-center text-gray-500">{t('noWeeksInRange')}</div>
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return (
      <div className="p-8 text-center text-gray-500">{t('noWeeksInRange')}</div>
    );
  }

  const weeks = await getMeetingWeeksByDateRange(fromDate, toDate);

  if (weeks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">{t('noWeeksInRange')}</div>
    );
  }

  const isWeekend = type === 'weekend';
  const title = isWeekend ? t('weekendTitle') : t('s140Title');

  return (
    <div>
      <div className="no-print flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">{title}</h1>
        <PrintButton />
      </div>
      {isWeekend
        ? weeks.map((week, index) => (
            <div
              key={week.id}
              className={index > 0 ? 'print-page-break' : undefined}
            >
              <WeekendProgram week={week} t={t} tw={tw} locale={locale} />
            </div>
          ))
        : weeks.map((week, index) => (
            <div
              key={week.id}
              className={index > 0 ? 'print-page-break' : undefined}
            >
              <S140Program
                week={week}
                t={t}
                tParts={tp}
                tSections={ts}
                locale={locale}
              />
            </div>
          ))}
    </div>
  );
}
