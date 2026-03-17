import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getPublisherById } from '@/data/publishers';
import { PublisherDetail } from '@/components/publishers/publisher-detail';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function PublisherDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('publishers');
  const tc = await getTranslations('common');

  const publisher = await getPublisherById(id);
  if (!publisher) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/publishers" />}>
          <ChevronLeftIcon className="size-4" data-icon="inline-start" />
          {tc('back')}
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('publisherDetail')}
        </h1>
      </div>
      <PublisherDetail publisher={publisher} />
    </div>
  );
}
