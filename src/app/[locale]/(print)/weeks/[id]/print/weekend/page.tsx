import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMeetingWeekById } from '@/data/meeting-weeks';
import { WeekendProgram } from '@/components/print/weekend-program';
import { PrintButton } from '@/components/print/print-button';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function WeekendPrintPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [week, tPrint, tWeekend] = await Promise.all([
    getMeetingWeekById(id),
    getTranslations('meetings.print'),
    getTranslations('meetings.weekend'),
  ]);

  if (!week) {
    notFound();
  }

  const t = (key: string, values?: Record<string, string | number>) =>
    (tPrint as any)(key, values) as string;
  const tw = (key: string) => (tWeekend as any)(key) as string;

  return (
    <div>
      <div className="no-print flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">{t('weekendTitle')}</h1>
        <PrintButton />
      </div>
      <WeekendProgram week={week} t={t} tw={tw} locale={locale} />
    </div>
  );
}
