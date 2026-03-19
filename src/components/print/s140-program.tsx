import type { MeetingWeekWithParts } from '@/data/meeting-weeks';
import { Section, Room } from '@/generated/prisma/enums';

type S140ProgramProps = {
  week: MeetingWeekWithParts;
  t: (key: string, values?: Record<string, string | number>) => string;
  tParts: (key: string) => string;
  tSections: (key: string) => string;
  locale: string;
};

// Section display order
const SECTION_ORDER = [
  { section: Section.OPENING, key: 'opening' },
  { section: Section.TREASURES, key: 'treasures' },
  { section: Section.MINISTRY_SCHOOL, key: 'ministrySchool' },
  { section: Section.CHRISTIAN_LIFE, key: 'christianLife' },
  { section: Section.CLOSING, key: 'closing' },
] as const;

/**
 * Section accent colors — used for screen display.
 * In print, these are overridden via .s140-section-header to use
 * borders instead of backgrounds (saves ink, better readability).
 */
const SECTION_COLORS: Record<Section, string> = {
  [Section.OPENING]: '#555555',
  [Section.TREASURES]: '#606a2f',
  [Section.MINISTRY_SCHOOL]: '#c18626',
  [Section.CHRISTIAN_LIFE]: '#8b2252',
  [Section.CLOSING]: '#555555',
};

/**
 * Section label prefixes for print — short identifiers
 * that help visually distinguish sections when color is removed.
 */
const SECTION_ICONS: Record<Section, string> = {
  [Section.OPENING]: '',
  [Section.TREASURES]: '\u25C6' /* ◆ */,
  [Section.MINISTRY_SCHOOL]: '\u25B6' /* ▶ */,
  [Section.CHRISTIAN_LIFE]: '\u2665' /* ♥ */,
  [Section.CLOSING]: '',
};

/**
 * Resolves the display name for a part.
 * Fixed parts have tituloKey-style titles (i18n keys) → translate them.
 * Dynamic parts have user-defined titles → use as-is.
 */
function resolvePartTitle(
  titulo: string | null,
  tParts: (key: string) => string
): string {
  if (!titulo) return '';
  // Fixed parts store keys like "meetings.parts.presidente"
  // We need to extract the last segment for the tParts translator
  if (titulo.startsWith('meetings.parts.')) {
    const partKey = titulo.replace('meetings.parts.', '');
    return tParts(partKey);
  }
  return titulo;
}

export function S140Program({
  week,
  t,
  tParts,
  tSections,
  locale,
}: S140ProgramProps) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const weekDate = dateFormatter.format(new Date(week.fechaInicio));

  // Group parts by section
  const partsBySection = new Map<Section, MeetingWeekWithParts['parts']>();
  for (const section of Object.values(Section)) {
    partsBySection.set(
      section,
      week.parts.filter((p) => p.seccion === section)
    );
  }

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-6 text-black">
      {/* Header */}
      <div className="mb-5 pb-3" style={{ borderBottom: '2pt solid #222' }}>
        <h1
          className="text-center text-xl font-bold tracking-tight"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >
          {t('s140Title')}
        </h1>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-bold">{t('weekOf', { date: weekDate })}</span>
          <span className="italic" style={{ color: '#333' }}>
            {week.lecturaSemanal}
          </span>
        </div>
      </div>

      {/* Opening song */}
      <div
        className="s140-song-bar mb-3 rounded bg-slate-100 px-3 py-2 text-sm font-semibold"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
      >
        {t('openingSong', { number: week.cancionApertura })}
      </div>

      {/* Sections */}
      {SECTION_ORDER.map(({ section, key }) => {
        const parts = partsBySection.get(section) ?? [];
        if (parts.length === 0) return null;

        const sectionColor = SECTION_COLORS[section];
        const sectionIcon = SECTION_ICONS[section];

        // Insert middle song before CHRISTIAN_LIFE
        const showMiddleSong = section === Section.CHRISTIAN_LIFE;
        // Insert closing song in CLOSING section
        const showClosingSong = section === Section.CLOSING;

        return (
          <div key={section} className="mb-4">
            {showMiddleSong && (
              <div
                className="s140-song-bar mb-3 rounded bg-slate-100 px-3 py-2 text-sm font-semibold"
                style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
              >
                {t('middleSong', { number: week.cancionIntermedia })}
              </div>
            )}

            {/* Section header — colored bg on screen, border-based in print */}
            <div
              className="s140-section-header mb-1.5 rounded px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: sectionColor }}
            >
              {sectionIcon && (
                <span className="mr-1.5" aria-hidden="true">
                  {sectionIcon}
                </span>
              )}
              {tSections(key)}
            </div>

            {/* Parts table */}
            <table className="w-full text-sm">
              <tbody>
                {parts.map((part) => {
                  const title = resolvePartTitle(part.titulo, tParts);
                  const isAux = part.sala === Room.AUXILIARY_1;
                  const assigneeName =
                    part.assignment?.publisher.nombre ?? t('unassigned');
                  const helperName = part.assignment?.helper?.nombre;

                  return (
                    <tr
                      key={part.id}
                      className="border-b border-slate-200"
                      style={{ borderBottomColor: '#ddd' }}
                    >
                      {/* Duration */}
                      <td
                        className="w-14 py-1.5 pr-2 text-right text-xs tabular-nums"
                        style={{
                          color: '#555',
                          fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        }}
                      >
                        {part.duracion
                          ? t('minutes', { min: part.duracion })
                          : ''}
                      </td>

                      {/* Part title */}
                      <td className="py-1.5">
                        <span style={{ color: '#111' }}>
                          {title}
                          {isAux && (
                            <span
                              className="ml-1 text-xs"
                              style={{ color: '#666' }}
                            >
                              ({t('auxiliaryRoom')})
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td
                        className="w-52 py-1.5 text-right font-semibold"
                        style={{ color: '#000' }}
                      >
                        {assigneeName}
                        {helperName && (
                          <span
                            className="ml-1 text-xs font-normal"
                            style={{ color: '#555' }}
                          >
                            / {helperName}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {showClosingSong && (
              <div
                className="s140-song-bar mt-3 rounded bg-slate-100 px-3 py-2 text-sm font-semibold"
                style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
              >
                {t('closingSong', { number: week.cancionCierre })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
