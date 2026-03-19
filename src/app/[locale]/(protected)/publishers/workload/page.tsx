import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getWorkloadOverview } from '@/data/publishers';
import { WorkloadOverview } from '@/components/publishers/workload-overview';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkloadOverviewPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('publishers');
  const tc = await getTranslations('common');
  const rawParams = await searchParams;

  const months = parseInt(
    typeof rawParams.months === 'string' ? rawParams.months : '3',
    10
  );

  const data = await getWorkloadOverview(months);

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
            {t('workloadOverview')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>
      <WorkloadOverview data={data} months={months} />
    </div>
  );
}
