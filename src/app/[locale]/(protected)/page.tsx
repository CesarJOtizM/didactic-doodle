import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock, Shield } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardContent />;
}

function DashboardContent() {
  const t = useTranslations();

  const stats = [
    {
      titleKey: 'nav.publishers',
      value: '--',
      icon: Users,
      description: 'Total registrados',
    },
    {
      titleKey: 'nav.meetings',
      value: '--',
      icon: Calendar,
      description: 'Semanas programadas',
    },
    {
      titleKey: 'nav.history',
      value: '--',
      icon: Clock,
      description: 'Asignaciones totales',
    },
    {
      titleKey: 'nav.attendants',
      value: '--',
      icon: Shield,
      description: 'Acomodadores activos',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('nav.dashboard')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('common.appName')}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.titleKey} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(stat.titleKey)}
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
