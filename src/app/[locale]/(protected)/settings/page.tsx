import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MigrationWizard } from '@/components/settings/migration-wizard';
import { BackupPanel } from '@/components/settings/backup-panel';
import { PageHeader } from '@/components/layout/page-header';

export default function SettingsPage() {
  const t = useTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <Tabs defaultValue="migration" className="flex-col">
        <TabsList className="flex w-full justify-start content-start">
          <TabsTrigger value="migration" className="flex-1">
            {t('tabs.migration')}
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex-1">
            {t('tabs.backup')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="migration" className="mt-6">
          <MigrationWizard />
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <BackupPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
