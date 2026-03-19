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
    <div className="mx-auto max-w-[210mm] bg-white text-black">
      {/* Title - visible on screen only */}
      <div className="no-print mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight">{t('s89Title')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('weekOf', { date: weekDate })}
        </p>
      </div>

      {/* Cards grid — 2 columns × 2 rows per A4 page */}
      <div className="s89-grid grid grid-cols-2 gap-0">
        {cards.map((card, index) => (
          <div
            key={card.partId}
            className="s89-card s89-cutting-guide flex flex-col border border-dashed border-slate-400"
            style={{
              height: '130mm' /* half of printable A4 height (~257mm ÷ 2) */,
              padding: '6mm 7mm',
              pageBreakInside: 'avoid',
              /* Force page break every 4 cards */
              ...(index > 0 && index % 4 === 0
                ? { pageBreakBefore: 'always' as const }
                : {}),
            }}
          >
            {/* Card header bar */}
            <div
              className="mb-3 border-b pb-2"
              style={{ borderBottomWidth: '1.5pt', borderBottomColor: '#333' }}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: '#555',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}
                >
                  {t('s89Title')}
                </span>
                <span className="text-xs" style={{ color: '#777' }}>
                  #{index + 1}
                </span>
              </div>
            </div>

            {/* Student name — prominent */}
            <div className="mb-3">
              <p
                className="text-xs font-normal uppercase tracking-wide"
                style={{
                  color: '#666',
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  fontSize: '7pt',
                }}
              >
                {t('studentName')}:
              </p>
              <p
                className="font-bold"
                style={{
                  fontSize: '14pt',
                  lineHeight: '1.3',
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                }}
              >
                {card.assigneeName}
              </p>
            </div>

            {/* Helper name — if applicable */}
            {card.helperName && (
              <div className="mb-3">
                <p
                  className="text-xs font-normal uppercase tracking-wide"
                  style={{
                    color: '#666',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    fontSize: '7pt',
                  }}
                >
                  {t('helper')}:
                </p>
                <p
                  className="font-semibold"
                  style={{
                    fontSize: '11pt',
                    lineHeight: '1.3',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}
                >
                  {card.helperName}
                </p>
              </div>
            )}

            {/* Assignment details — structured fields */}
            <div
              className="mt-auto space-y-0 border-t pt-3"
              style={{ borderTopWidth: '0.5pt', borderTopColor: '#ccc' }}
            >
              {/* Date */}
              <div
                className="flex items-baseline justify-between py-1"
                style={{ borderBottom: '0.5pt solid #e5e5e5' }}
              >
                <span
                  className="text-xs font-semibold uppercase"
                  style={{
                    color: '#555',
                    fontSize: '7pt',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}
                >
                  {t('date')}
                </span>
                <span className="font-semibold" style={{ fontSize: '10pt' }}>
                  {card.date}
                </span>
              </div>

              {/* Assignment / Part */}
              <div
                className="flex items-baseline justify-between py-1"
                style={{ borderBottom: '0.5pt solid #e5e5e5' }}
              >
                <span
                  className="text-xs font-semibold uppercase"
                  style={{
                    color: '#555',
                    fontSize: '7pt',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}
                >
                  {t('part')}
                </span>
                <span
                  className="text-right font-semibold"
                  style={{ fontSize: '10pt', maxWidth: '65%' }}
                >
                  {card.partTitle}
                </span>
              </div>

              {/* Room */}
              <div className="flex items-baseline justify-between py-1">
                <span
                  className="text-xs font-semibold uppercase"
                  style={{
                    color: '#555',
                    fontSize: '7pt',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}
                >
                  {t('room')}
                </span>
                <span className="font-semibold" style={{ fontSize: '10pt' }}>
                  {card.room}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cutting guide note — screen only */}
      <p className="no-print mt-6 text-center text-xs text-slate-400">
        {t('cuttingGuide')}
      </p>
    </div>
  );
}
