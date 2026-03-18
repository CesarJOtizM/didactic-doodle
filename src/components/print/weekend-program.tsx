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
    <div className="mx-auto max-w-[210mm] bg-white p-6 font-serif text-black">
      {/* Header */}
      <div className="mb-5 border-b-2 border-slate-800 pb-3">
        <h1 className="text-center text-xl font-bold tracking-tight">
          {t('weekendTitle')}
        </h1>
        <div className="mt-2 text-center text-sm font-bold">
          {t('weekOf', { date: weekDate })}
        </div>
      </div>

      {/* Public Talk */}
      <div className="mb-5">
        <div className="mb-2 rounded bg-indigo-800 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white">
          {tw('publicTalk')}
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-2 text-slate-600">{tw('talkTopic')}</td>
              <td className="py-2 text-right font-semibold">
                {wm?.discursoTema || t('unassigned')}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 text-slate-600">{tw('talkSpeaker')}</td>
              <td className="py-2 text-right font-semibold">
                {wm?.discursoOrador || t('unassigned')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Roles */}
      <div className="mb-5">
        <div className="mb-2 rounded bg-slate-700 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white">
          {tw('roles')}
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-2 text-slate-600">{tw('presidente')}</td>
              <td className="py-2 text-right font-semibold">
                {wm?.presidente?.nombre || t('unassigned')}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 text-slate-600">{tw('openingPrayer')}</td>
              <td className="py-2 text-right font-semibold">
                {wm?.oracionInicial?.nombre || (
                  <span className="text-xs italic text-slate-500">
                    {tw('givenByPresidente')}
                  </span>
                )}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 text-slate-600">
                {tw('watchtowerConductor')}
              </td>
              <td className="py-2 text-right font-semibold">
                {wm?.conductor?.nombre || t('unassigned')}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 text-slate-600">{tw('watchtowerReader')}</td>
              <td className="py-2 text-right font-semibold">
                {wm?.lector?.nombre || t('unassigned')}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 text-slate-600">{tw('closingPrayer')}</td>
              <td className="py-2 text-right font-semibold">
                {wm?.oracionFinal?.nombre || t('unassigned')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
