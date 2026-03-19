import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CsvImportPublishers } from '@/components/settings/csv-import-publishers';
import { BackupPanel } from '@/components/settings/backup-panel';
import { PageHeader } from '@/components/layout/page-header';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <Tabs defaultValue="import" className="flex-col">
        <TabsList className="flex w-full justify-start content-start">
          <TabsTrigger value="import" className="flex-1">
            {t('tabs.import')}
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex-1">
            {t('tabs.backup')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <CsvImportPublishers />
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <BackupPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
