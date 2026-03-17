import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getMeetingWeekById } from '@/data/meeting-weeks';
import { WeekDetail } from '@/components/weeks/week-detail';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function WeekDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('meetings');
  const tc = await getTranslations('common');

  const week = await getMeetingWeekById(id);
  if (!week) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/weeks" />}>
          <ChevronLeftIcon className="size-4" data-icon="inline-start" />
          {tc('back')}
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t('weekDetail')}</h1>
      </div>
      <WeekDetail week={week} />
    </div>
  );
}
