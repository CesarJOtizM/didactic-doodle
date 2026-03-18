import { Gender, Role, Section, PartType } from '@/generated/prisma/enums';
import type { PublisherCandidate, PartSlot } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────

function isElder(p: PublisherCandidate): boolean {
  return p.sexo === Gender.MALE && p.rol === Role.ELDER;
}

function isElderOrMinisterial(p: PublisherCandidate): boolean {
  return (
    p.sexo === Gender.MALE &&
    (p.rol === Role.ELDER || p.rol === Role.MINISTERIAL_SERVANT)
  );
}

function isMale(p: PublisherCandidate): boolean {
  return p.sexo === Gender.MALE;
}

function isBaptizedMale(p: PublisherCandidate): boolean {
  return (
    p.sexo === Gender.MALE &&
    (p.rol === Role.ELDER ||
      p.rol === Role.MINISTERIAL_SERVANT ||
      p.rol === Role.BAPTIZED_PUBLISHER)
  );
}

/** Prayer eligibility: based solely on the habilitadoOracion boolean */
function canPray(p: PublisherCandidate): boolean {
  return p.habilitadoOracion;
}

/** Reader eligibility: based solely on the habilitadoLectura boolean */
function canRead(p: PublisherCandidate): boolean {
  return p.habilitadoLectura;
}

/** Anyone who passes prerequisites (the filter is a pass-through) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function anyone(_p: PublisherCandidate): boolean {
  return true;
}

// ─── Eligibility Matrix ───────────────────────────────────────────────

/**
 * Maps eligibility keys to filter predicates.
 *
 * For FIXED parts: the key is the `tituloKey` from FIXED_PARTS_TEMPLATE.
 * For DYNAMIC parts: the key is derived from section:tipo or a helper suffix.
 */
const ELIGIBILITY_MATRIX: Record<string, (p: PublisherCandidate) => boolean> = {
  // ── Fixed parts (by tituloKey) ──
  'meetings.parts.presidente': isElder,
  'meetings.parts.openingPrayer': canPray,
  'meetings.parts.treasuresDiscourse': isElderOrMinisterial,
  'meetings.parts.pearls': isElderOrMinisterial,
  'meetings.parts.bibleReading': isMale,
  'meetings.parts.bibleReadingAux': isMale,
  'meetings.parts.schoolOverseer': isElder,
  'meetings.parts.schoolOverseerAux': isElder,
  'meetings.parts.studyConductor': isElderOrMinisterial,
  'meetings.parts.studyReader': canRead,
  'meetings.parts.closingPrayer': canPray,

  // ── Dynamic SMM parts ──
  'MINISTRY_SCHOOL:DEMONSTRATION:titular': anyone,
  'MINISTRY_SCHOOL:SPEECH:titular': isMale,
  'MINISTRY_SCHOOL:helper': anyone,

  // ── Dynamic NVC parts ──
  // Dynamic NVC parts (like NVC 1, NVC 2) can be done by any baptized male
  // (not just elders/servants like the fixed studyConductor/studyReader)
  'CHRISTIAN_LIFE:dynamic': isBaptizedMale,
};

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Derives the eligibility key for a part.
 *
 * Fixed parts use their `tituloKey`.
 * Dynamic parts use a composite key based on section + tipo.
 */
export function getEligibilityKey(part: PartSlot): string {
  // Fixed part with known tituloKey
  if (part.tituloKey && part.tituloKey in ELIGIBILITY_MATRIX) {
    return part.tituloKey;
  }

  // Dynamic SMM parts (MINISTRY_SCHOOL without a fixed tituloKey)
  if (part.seccion === Section.MINISTRY_SCHOOL) {
    if (part.tipo === PartType.DEMONSTRATION) {
      return 'MINISTRY_SCHOOL:DEMONSTRATION:titular';
    }
    if (part.tipo === PartType.SPEECH) {
      return 'MINISTRY_SCHOOL:SPEECH:titular';
    }
    // Fallback for any other SMM type (e.g., READING in SMM section)
    return 'MINISTRY_SCHOOL:SPEECH:titular';
  }

  // Dynamic NVC parts (CHRISTIAN_LIFE without a fixed tituloKey like studyConductor/studyReader)
  // These can be presented by any baptized male (not just elders/servants)
  if (part.seccion === Section.CHRISTIAN_LIFE) {
    // Check if it's a fixed part that we missed
    if (part.tituloKey === 'meetings.parts.studyConductor') {
      return 'meetings.parts.studyConductor';
    }
    if (part.tituloKey === 'meetings.parts.studyReader') {
      return 'meetings.parts.studyReader';
    }
    // Dynamic NVC parts can be done by any baptized male
    return 'CHRISTIAN_LIFE:dynamic';
  }

  // Shouldn't reach here for valid parts — return a key that won't match
  return `${part.seccion}:${part.tipo}:unknown`;
}

/**
 * Returns the eligibility key used specifically for helper selection.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHelperEligibilityKey(_part: PartSlot): string {
  return 'MINISTRY_SCHOOL:helper';
}

/**
 * Checks if a publisher is eligible for a given eligibility key.
 * Prerequisites (habilitadoVMC, estado, skipAssignment) must be checked
 * BEFORE calling this — this function only checks role/gender eligibility.
 */
export function isEligible(
  publisher: PublisherCandidate,
  eligibilityKey: string
): boolean {
  const filter = ELIGIBILITY_MATRIX[eligibilityKey];
  if (!filter) {
    return false;
  }
  return filter(publisher);
}

/**
 * Filters publishers to only those eligible for a given part.
 * Applies prerequisite check + eligibility matrix.
 */
export function getEligibleCandidates(
  publishers: PublisherCandidate[],
  part: PartSlot
): PublisherCandidate[] {
  const key = getEligibilityKey(part);
  return publishers.filter((p) => passesPrerequisites(p) && isEligible(p, key));
}

/**
 * Filters publishers eligible as helpers for a given part.
 *
 * For MINISTRY_SCHOOL DEMONSTRATION parts (auto-assignment only),
 * the helper must be the same gender as the titular.
 * Pass `titularGender` to enable this filter; omit it for manual assignment.
 */
export function getEligibleHelpers(
  publishers: PublisherCandidate[],
  part: PartSlot,
  titularGender?: Gender
): PublisherCandidate[] {
  const key = getHelperEligibilityKey(part);
  return publishers.filter((p) => {
    if (!passesPrerequisites(p) || !isEligible(p, key)) return false;

    // Same-gender constraint for demonstration helpers (auto-assignment)
    if (
      titularGender !== undefined &&
      part.seccion === Section.MINISTRY_SCHOOL &&
      part.tipo === PartType.DEMONSTRATION
    ) {
      if (p.sexo !== titularGender) return false;
    }

    return true;
  });
}

/**
 * Prerequisite filter per REQ-ELIG-01:
 * habilitadoVMC = true, estado = ACTIVE, skipAssignment = false.
 */
function passesPrerequisites(p: PublisherCandidate): boolean {
  return p.habilitadoVMC && p.estado === 'ACTIVE' && !p.skipAssignment;
}
