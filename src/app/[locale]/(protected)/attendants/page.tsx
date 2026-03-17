import { setRequestLocale } from 'next-intl/server';
import { getTranslations, getFormatter } from 'next-intl/server';
import { getRecentAttendantAssignments } from '@/data/attendants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

const ROLE_ORDER = [
  'DOORMAN',
  'ATTENDANT',
  'MICROPHONE_1',
  'MICROPHONE_2',
] as const;

export default async function AttendantsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('attendants');
  const format = await getFormatter();
  const rows = await getRecentAttendantAssignments(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('noAssignments')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t('noAssignmentsHint')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => {
            const dateStr = format.dateTime(row.fecha, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const key = `${row.fecha.toISOString()}_${row.meetingType}`;

            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {t('weekOf', { date: dateStr })}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {t(`meetingTypes.${row.meetingType}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-0.5">
                  {ROLE_ORDER.map((role, index) => {
                    const assignment = row.assignments.find(
                      (a) => a.attendantRole === role
                    );
                    return (
                      <div
                        key={role}
                        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                          index % 2 === 0 ? 'bg-muted/30' : ''
                        }`}
                      >
                        <span className="font-medium text-muted-foreground">
                          {t(`roles.${role}`)}
                        </span>
                        <span
                          className={
                            assignment ? '' : 'italic text-muted-foreground/50'
                          }
                        >
                          {assignment?.publisherNombre ?? '—'}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
