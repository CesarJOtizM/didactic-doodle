import { Fragment } from 'react';
import type { AttendantAssignmentWithPublisher } from '@/data/attendants';

type Props = {
  assignments: AttendantAssignmentWithPublisher[];
  t: (key: string, values?: Record<string, string | number>) => string;
  fromDate: string;
  toDate: string;
  locale: string;
};

const ROLE_ORDER = [
  'DOORMAN',
  'ATTENDANT',
  'MICROPHONE_1',
  'MICROPHONE_2',
] as const;

const MEETING_TYPES = ['MIDWEEK', 'WEEKEND'] as const;

type WeekGroup = {
  fecha: Date;
  meetings: Record<string, Record<string, string>>;
};

function formatWeekRange(monday: Date, locale: string): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric' });

  const monMonth = monthFmt.format(monday);
  const monDay = dayFmt.format(monday);
  const sunDay = dayFmt.format(sunday);
  const sunMonth = monthFmt.format(sunday);

  if (monMonth === sunMonth) {
    return `${monMonth} ${monDay}–${sunDay}`;
  }
  return `${monMonth} ${monDay} – ${sunMonth} ${sunDay}`;
}

function groupByWeek(
  assignments: AttendantAssignmentWithPublisher[]
): WeekGroup[] {
  const map = new Map<string, WeekGroup>();

  for (const a of assignments) {
    const key = a.fecha.toISOString();
    let group = map.get(key);
    if (!group) {
      group = { fecha: a.fecha, meetings: {} };
      map.set(key, group);
    }
    if (!group.meetings[a.meetingType]) {
      group.meetings[a.meetingType] = {};
    }
    group.meetings[a.meetingType][a.attendantRole] = a.publisher.nombre;
  }

  return Array.from(map.values()).sort(
    (a, b) => a.fecha.getTime() - b.fecha.getTime()
  );
}

export function AttendantReport({
  assignments,
  t,
  fromDate,
  toDate,
  locale,
}: Props) {
  const weeks = groupByWeek(assignments);

  const fmtFrom = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(fromDate));

  const fmtTo = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(toDate));

  return (
    <div className="mx-auto max-w-4xl p-6 print:max-w-none print:p-0">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold">{t('reportTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground print:text-gray-600">
          {t('dateRange', { from: fmtFrom, to: fmtTo })}
        </p>
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="px-3 py-2 text-left font-semibold">{t('week')}</th>
            {ROLE_ORDER.map((role) => (
              <th key={role} className="px-3 py-2 text-left font-semibold">
                {t(`roles.${role}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => (
            <Fragment key={week.fecha.toISOString()}>
              {MEETING_TYPES.map((mt, mtIdx) => {
                const meetingAssignments = week.meetings[mt] ?? {};
                const isFirst = mtIdx === 0;
                const isLast = mtIdx === MEETING_TYPES.length - 1;

                return (
                  <tr
                    key={`${week.fecha.toISOString()}_${mt}`}
                    className={`${isLast && weekIdx < weeks.length - 1 ? 'border-b border-gray-300' : ''} ${weekIdx % 2 === 0 ? 'bg-gray-50 print:bg-gray-50' : ''}`}
                  >
                    <td className="px-3 py-1.5 align-top">
                      {isFirst ? (
                        <div>
                          <div className="font-medium">
                            {formatWeekRange(week.fecha, locale)}
                          </div>
                          <div className="text-xs text-muted-foreground print:text-gray-500">
                            {t(`meetingTypes.${mt}`)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground print:text-gray-500 pl-2">
                          {t(`meetingTypes.${mt}`)}
                        </div>
                      )}
                    </td>
                    {ROLE_ORDER.map((role) => (
                      <td key={role} className="px-3 py-1.5 align-top">
                        {meetingAssignments[role] ?? (
                          <span className="text-muted-foreground/40 print:text-gray-300">
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
