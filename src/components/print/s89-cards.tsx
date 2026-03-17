import type { MeetingWeekWithParts } from '@/data/meeting-weeks';
import { Room } from '@/generated/prisma/enums';

type S89CardsProps = {
  week: MeetingWeekWithParts;
  t: (key: string, values?: Record<string, string | number>) => string;
  tParts: (key: string) => string;
  locale: string;
};

type CardData = {
  partId: string;
  assigneeName: string;
  partTitle: string;
  date: string;
  room: string;
  helperName: string | null;
};

/**
 * Resolves display name for a part title.
 * Fixed parts have i18n keys, dynamic parts have user-defined titles.
 */
function resolvePartTitle(
  titulo: string | null,
  tParts: (key: string) => string
): string {
  if (!titulo) return '';
  if (titulo.startsWith('meetings.parts.')) {
    const partKey = titulo.replace('meetings.parts.', '');
    return tParts(partKey);
  }
  return titulo;
}

export function S89Cards({ week, t, tParts, locale }: S89CardsProps) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const weekDate = dateFormatter.format(new Date(week.fechaInicio));

  // Build card data from assigned parts only
  const cards: CardData[] = week.parts
    .filter((part) => part.assignment)
    .map((part) => ({
      partId: part.id,
      assigneeName: part.assignment!.publisher.nombre,
      partTitle: resolvePartTitle(part.titulo, tParts),
      date: weekDate,
      room: part.sala === Room.AUXILIARY_1 ? t('auxiliaryRoom') : t('mainRoom'),
      helperName: part.assignment!.helper?.nombre ?? null,
    }));

  if (cards.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">{t('unassigned')}</div>
    );
  }

  return (
    <div className="mx-auto max-w-[210mm] bg-white font-serif text-black">
      {/* Title - visible on screen, hidden in print */}
      <div className="no-print mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight">{t('s89Title')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('weekOf', { date: weekDate })}
        </p>
      </div>

      {/* Cards grid — 2 columns for A4 */}
      <div className="s89-grid grid grid-cols-2 gap-0">
        {cards.map((card) => (
          <div
            key={card.partId}
            className="s89-card s89-cutting-guide border border-dashed border-slate-400 p-5"
          >
            {/* Card header */}
            <div className="mb-3 border-b-2 border-slate-800 pb-2">
              <h2 className="text-base font-bold">{card.assigneeName}</h2>
            </div>

            {/* Card body */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('date')}:</span>
                <span className="font-semibold">{card.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('part')}:</span>
                <span className="font-semibold">{card.partTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('room')}:</span>
                <span className="font-semibold">{card.room}</span>
              </div>
              {card.helperName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('helper')}:</span>
                  <span className="font-semibold">{card.helperName}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cutting guide note */}
      <p className="no-print mt-6 text-center text-xs text-slate-400">
        {t('cuttingGuide')}
      </p>
    </div>
  );
}
