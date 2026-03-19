import type { MeetingWeekWithParts } from '@/data/meeting-weeks';

type WeekendProgramProps = {
  week: MeetingWeekWithParts;
  t: (key: string, values?: Record<string, string | number>) => string;
  tw: (key: string) => string;
  locale: string;
};

export function WeekendProgram({ week, t, tw, locale }: WeekendProgramProps) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const weekDate = dateFormatter.format(new Date(week.fechaInicio));
  const wm = week.weekendMeeting;

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-6 text-black">
      {/* Header */}
      <div className="mb-5 pb-3" style={{ borderBottom: '2pt solid #222' }}>
        <h1
          className="text-center text-xl font-bold tracking-tight"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >
          {t('weekendTitle')}
        </h1>
        <div
          className="mt-2 text-center text-sm font-bold"
          style={{ color: '#333' }}
        >
          {t('weekOf', { date: weekDate })}
        </div>
      </div>

      {/* Public Talk */}
      <div className="mb-5">
        <div
          className="weekend-section-header mb-2 rounded bg-indigo-800 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >
          {tw('publicTalk')}
        </div>

        {/* Talk topic — prominent */}
        {wm?.discursoTema && (
          <div className="mb-2 px-1">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{
                color: '#666',
                fontSize: '7pt',
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {tw('talkTopic')}
            </p>
            <p
              className="font-bold"
              style={{ fontSize: '13pt', lineHeight: '1.3', color: '#111' }}
            >
              {wm.discursoTema}
            </p>
          </div>
        )}

        <table className="w-full text-sm">
          <tbody>
            {!wm?.discursoTema && (
              <tr style={{ borderBottom: '0.5pt solid #ddd' }}>
                <td className="py-2" style={{ color: '#444' }}>
                  {tw('talkTopic')}
                </td>
                <td className="py-2 text-right font-semibold">
                  {t('unassigned')}
                </td>
              </tr>
            )}
            <tr style={{ borderBottom: '0.5pt solid #ddd' }}>
              <td className="py-2" style={{ color: '#444' }}>
                {tw('talkSpeaker')}
              </td>
              <td
                className="py-2 text-right font-semibold"
                style={{ color: '#000' }}
              >
                {wm?.discursoOrador || t('unassigned')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Roles */}
      <div className="mb-5">
        <div
          className="weekend-section-header mb-2 rounded bg-slate-700 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >
          {tw('roles')}
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr style={{ borderBottom: '0.5pt solid #ddd' }}>
              <td className="py-2" style={{ color: '#444' }}>
                {tw('presidente')}
              </td>
              <td
                className="py-2 text-right font-semibold"
                style={{ color: '#000' }}
              >
                {wm?.presidente?.nombre || t('unassigned')}
              </td>
            </tr>
            <tr style={{ borderBottom: '0.5pt solid #ddd' }}>
              <td className="py-2" style={{ color: '#444' }}>
                {tw('openingPrayer')}
              </td>
              <td
                className="py-2 text-right font-semibold"
                style={{ color: '#000' }}
              >
                {wm?.oracionInicial?.nombre || (
                  <span className="text-xs italic" style={{ color: '#555' }}>
                    {tw('givenByPresidente')}
                  </span>
                )}
              </td>
            </tr>
            <tr style={{ borderBottom: '0.5pt solid #ddd' }}>
              <td className="py-2" style={{ color: '#444' }}>
                {tw('watchtowerConductor')}
              </td>
              <td
                className="py-2 text-right font-semibold"
                style={{ color: '#000' }}
              >
                {wm?.conductor?.nombre || t('unassigned')}
              </td>
            </tr>
            <tr style={{ borderBottom: '0.5pt solid #ddd' }}>
              <td className="py-2" style={{ color: '#444' }}>
                {tw('watchtowerReader')}
              </td>
              <td
                className="py-2 text-right font-semibold"
                style={{ color: '#000' }}
              >
                {wm?.lector?.nombre || t('unassigned')}
              </td>
            </tr>
            <tr style={{ borderBottom: '0.5pt solid #ddd' }}>
              <td className="py-2" style={{ color: '#444' }}>
                {tw('closingPrayer')}
              </td>
              <td
                className="py-2 text-right font-semibold"
                style={{ color: '#000' }}
              >
                {wm?.oracionFinal?.nombre || t('unassigned')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
