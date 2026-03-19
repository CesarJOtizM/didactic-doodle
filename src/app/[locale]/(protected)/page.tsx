import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock, Shield } from 'lucide-react';
import { prisma } from '@/data/prisma';
import { PublisherStatus } from '@/generated/prisma/enums';
import { PageHeader } from '@/components/layout/page-header';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('nav'),
  ]);

  // ─── Fetch real data ────────────────────────────────────────────────
  const now = new Date();

  const [publisherCount, currentWeek, assignmentCount, attendantCount] =
    await Promise.all([
      // Total publishers with estado != INACTIVE
      prisma.publisher.count({
        where: { estado: { not: PublisherStatus.INACTIVE } },
      }),

      // Current week: find MeetingWeek where now is between fechaInicio and fechaFin
      prisma.meetingWeek.findFirst({
        where: {
          fechaInicio: { lte: now },
          fechaFin: { gte: now },
        },
        select: { estado: true },
      }),

      // Total assignment history records
      prisma.assignmentHistory.count(),

      // Active attendants: habilitadoAcomodador=true OR habilitadoMicrofono=true
      prisma.publisher.count({
        where: {
          estado: { not: PublisherStatus.INACTIVE },
          OR: [{ habilitadoAcomodador: true }, { habilitadoMicrofono: true }],
        },
      }),
    ]);

  // Resolve current week display value
  const currentWeekValue = currentWeek
    ? currentWeek.estado
    : t('stats.noWeekCreated');

  const stats = [
    {
      title: tNav('publishers'),
      value: String(publisherCount),
      icon: Users,
      description: t('stats.totalPublishers'),
    },
    {
      title: tNav('meetings'),
      value: currentWeekValue,
      icon: Calendar,
      description: t('stats.currentWeek'),
    },
    {
      title: tNav('history'),
      value: String(assignmentCount),
      icon: Clock,
      description: t('stats.totalAssignments'),
    },
    {
      title: tNav('attendants'),
      value: String(attendantCount),
      icon: Shield,
      description: t('stats.activeAttendants'),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={tNav('dashboard')}
        description={t('stats.currentWeek')}
      />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
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
