import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getAttendantAssignmentsByDateRange } from '@/data/attendants';
import { AttendantReport } from '@/components/print/attendant-report';
import { PrintButton } from '@/components/print/print-button';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function AttendantPrintPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { from, to } = await searchParams;
  const tAtt = await getTranslations('attendants');

  // Wrap into a simple string function for the print component
  const t = (key: string, values?: Record<string, string | number>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tAtt as any)(`printReport.${key}`, values) as string;
  const tRoles = (key: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tAtt as any)(`roles.${key}`) as string;
  const tMeetings = (key: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tAtt as any)(`meetingTypes.${key}`) as string;

  // Combined translator that handles nested keys
  const combinedT = (key: string, values?: Record<string, string | number>) => {
    if (key.startsWith('roles.')) return tRoles(key.replace('roles.', ''));
    if (key.startsWith('meetingTypes.'))
      return tMeetings(key.replace('meetingTypes.', ''));
    return t(key, values);
  };

  if (!from || !to) {
    return (
      <div className="p-8 text-center text-gray-500">{t('missingDates')}</div>
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return (
      <div className="p-8 text-center text-gray-500">{t('invalidDates')}</div>
    );
  }

  const assignments = await getAttendantAssignmentsByDateRange(
    fromDate,
    toDate
  );

  if (assignments.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t('noAssignmentsInRange')}
      </div>
    );
  }

  return (
    <div>
      <div className="no-print flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">{t('reportTitle')}</h1>
        <PrintButton />
      </div>
      <AttendantReport
        assignments={assignments}
        t={combinedT}
        fromDate={from}
        toDate={to}
        locale={locale}
      />
    </div>
  );
}
