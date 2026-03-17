import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMeetingWeekById } from '@/data/meeting-weeks';
import { S140Program } from '@/components/print/s140-program';
import { PrintButton } from '@/components/print/print-button';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function S140PrintPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [week, tPrint, tParts, tSections] = await Promise.all([
    getMeetingWeekById(id),
    getTranslations('meetings.print'),
    getTranslations('meetings.parts'),
    getTranslations('meetings.sections'),
  ]);

  if (!week) {
    notFound();
  }

  // Wrap typed translators into simple string functions for the print component
  const t = (key: string, values?: Record<string, string | number>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tPrint as any)(key, values) as string;
  const tp = (key: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tParts as any)(key) as string;
  const ts = (key: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tSections as any)(key) as string;

  return (
    <div>
      <div className="no-print flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">{t('s140Title')}</h1>
        <PrintButton />
      </div>
      <S140Program
        week={week}
        t={t}
        tParts={tp}
        tSections={ts}
        locale={locale}
      />
    </div>
  );
}
