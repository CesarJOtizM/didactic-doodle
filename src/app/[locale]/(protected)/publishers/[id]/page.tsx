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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          nativeButton={false}
          render={<Link href="/publishers" />}
          aria-label={tc('back')}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {publisher.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('publisherDetail')}
          </p>
        </div>
      </div>
      <PublisherDetail publisher={publisher} />
    </div>
  );
}
