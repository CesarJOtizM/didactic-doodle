/**
 * Returns true if the given date falls on a Monday (day 1 in JS).
 */
export function isMonday(date: Date): boolean {
  return date.getUTCDay() === 1;
}

/**
 * Returns the Sunday that ends the meeting week.
 * fechaInicio must be a Monday; the end is fechaInicio + 6 days.
 */
export function getWeekEnd(fechaInicio: Date): Date {
  const end = new Date(fechaInicio);
  end.setDate(end.getDate() + 6);
  return end;
}

/**
 * Formats a week range as a human-readable string.
 * Example: "Mar 16 – Mar 22, 2026" (en) or "16 mar. – 22 mar. 2026" (es)
 */
export function formatWeekRange(
  fechaInicio: Date,
  fechaFin: Date,
  locale: string
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });
  const yearFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
  });

  const start = formatter.format(fechaInicio);
  const end = formatter.format(fechaFin);
  const year = yearFormatter.format(fechaFin);

  return `${start} – ${end}, ${year}`;
}
