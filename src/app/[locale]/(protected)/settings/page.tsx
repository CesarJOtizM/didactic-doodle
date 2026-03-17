import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MigrationWizard } from '@/components/settings/migration-wizard';
import { BackupPanel } from '@/components/settings/backup-panel';

export default function SettingsPage() {
  const t = useTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

      <Tabs defaultValue="migration">
        <TabsList>
          <TabsTrigger value="migration">{t('tabs.migration')}</TabsTrigger>
          <TabsTrigger value="backup">{t('tabs.backup')}</TabsTrigger>
        </TabsList>

        <TabsContent value="migration" className="mt-4">
          <MigrationWizard />
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <BackupPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
