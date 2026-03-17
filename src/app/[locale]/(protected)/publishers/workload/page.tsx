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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/publishers" />}>
          <ChevronLeftIcon className="size-4" data-icon="inline-start" />
          {tc('back')}
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('workloadOverview')}
        </h1>
      </div>
      <WorkloadOverview data={data} months={months} />
    </div>
  );
}
