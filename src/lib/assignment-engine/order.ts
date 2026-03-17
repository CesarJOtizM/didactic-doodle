import { Section, Room } from '@/generated/prisma/enums';
import type { PartSlot } from './types';

// ─── Priority Map ─────────────────────────────────────────────────────

/**
 * Fixed parts priority by tituloKey.
 * Lower number = assigned first (most restrictive pool).
 * Per RF-AUTO-05 / REQ-ORD-01.
 */
const FIXED_PRIORITY: Record<string, number> = {
  'meetings.parts.presidente': 0,
  'meetings.parts.schoolOverseer': 1,
  'meetings.parts.openingPrayer': 2,
  'meetings.parts.treasuresDiscourse': 3,
  'meetings.parts.pearls': 3,
  'meetings.parts.studyConductor': 5,
  'meetings.parts.studyReader': 6,
  'meetings.parts.bibleReading': 7,
  'meetings.parts.bibleReadingAux': 7,
  'meetings.parts.closingPrayer': 12,
};

/**
 * Gets the assignment priority for a part.
 * Lower number = higher priority (assigned first).
 */
function getPriority(part: PartSlot): number {
  // Fixed parts with known tituloKey
  if (part.tituloKey && part.tituloKey in FIXED_PRIORITY) {
    return FIXED_PRIORITY[part.tituloKey];
  }

  // Dynamic NVC parts: CHRISTIAN_LIFE section, not studyConductor/studyReader
  if (part.seccion === Section.CHRISTIAN_LIFE) {
    return 4;
  }

  // Dynamic SMM parts: MINISTRY_SCHOOL section, not schoolOverseer
  if (part.seccion === Section.MINISTRY_SCHOOL) {
    if (part.sala === Room.MAIN) {
      return 8; // SMM MAIN titulares
    }
    return 9; // SMM AUX titulares
  }

  // Fallback — shouldn't happen for well-formed data
  return 99;
}

/**
 * Gets the room sort order (MAIN before AUXILIARY).
 */
function getRoomOrder(part: PartSlot): number {
  return part.sala === Room.MAIN ? 0 : 1;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Sorts parts by assignment priority per RF-AUTO-05.
 * Most restrictive pools are assigned first to prevent constraint starvation.
 *
 * Sort order:
 * 1. Priority (ascending — lower = more restrictive = first)
 * 2. Room (MAIN before AUXILIARY for same priority)
 * 3. Orden (original template order within same priority + room)
 *
 * Returns a NEW sorted array (does not mutate input).
 */
export function getAssignmentOrder(parts: PartSlot[]): PartSlot[] {
  return [...parts].sort((a, b) => {
    const priorityDiff = getPriority(a) - getPriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const roomDiff = getRoomOrder(a) - getRoomOrder(b);
    if (roomDiff !== 0) return roomDiff;

    return a.orden - b.orden;
  });
}
