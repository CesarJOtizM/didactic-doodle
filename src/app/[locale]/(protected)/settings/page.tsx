import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MigrationWizard } from '@/components/settings/migration-wizard';
import { BackupPanel } from '@/components/settings/backup-panel';

export default function SettingsPage() {
  const t = useTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

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
