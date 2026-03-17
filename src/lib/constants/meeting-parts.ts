import { Section, PartType, Room } from '@/generated/prisma/enums';

// ─── Types ───────────────────────────────────────────────────────────

export type FixedPartTemplate = {
  seccion: Section;
  tipo: PartType;
  tituloKey: string;
  orden: number;
  duracion: number | null;
  sala: Room;
  requiereAyudante: boolean;
  /** When true, this part is only created if salaAuxiliarActiva is true */
  onlyIfAuxiliary: boolean;
  /** Eligibility description — for reference only, not used at runtime */
  eligibility: string;
};

// ─── Fixed Part Templates ────────────────────────────────────────────

/**
 * All fixed parts auto-generated when a MeetingWeek is created.
 * Ordered by section, then by `orden` within section.
 * Dynamic parts (SMM, NVC) are NOT included here — they are user-defined.
 */
export const FIXED_PARTS_TEMPLATE: readonly FixedPartTemplate[] = [
  // ── OPENING ──
  {
    seccion: Section.OPENING,
    tipo: PartType.SPEECH,
    tituloKey: 'meetings.parts.presidente',
    orden: 1,
    duracion: null,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder',
  },
  {
    seccion: Section.OPENING,
    tipo: PartType.PRAYER,
    tituloKey: 'meetings.parts.openingPrayer',
    orden: 2,
    duracion: null,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder, Ministerial Servant',
  },

  // ── TREASURES ──
  {
    seccion: Section.TREASURES,
    tipo: PartType.SPEECH,
    tituloKey: 'meetings.parts.treasuresDiscourse',
    orden: 1,
    duracion: 10,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder, Ministerial Servant',
  },
  {
    seccion: Section.TREASURES,
    tipo: PartType.DISCUSSION,
    tituloKey: 'meetings.parts.pearls',
    orden: 2,
    duracion: 10,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder, Ministerial Servant',
  },
  {
    seccion: Section.TREASURES,
    tipo: PartType.READING,
    tituloKey: 'meetings.parts.bibleReading',
    orden: 3,
    duracion: 4,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Any male',
  },
  {
    seccion: Section.TREASURES,
    tipo: PartType.READING,
    tituloKey: 'meetings.parts.bibleReadingAux',
    orden: 4,
    duracion: 4,
    sala: Room.AUXILIARY_1,
    requiereAyudante: false,
    onlyIfAuxiliary: true,
    eligibility: 'Any male (only if salaAuxiliarActiva)',
  },

  // ── MINISTRY_SCHOOL ──
  {
    seccion: Section.MINISTRY_SCHOOL,
    tipo: PartType.SPEECH,
    tituloKey: 'meetings.parts.schoolOverseer',
    orden: 1,
    duracion: null,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder',
  },

  // ── CHRISTIAN_LIFE ──
  {
    seccion: Section.CHRISTIAN_LIFE,
    tipo: PartType.STUDY,
    tituloKey: 'meetings.parts.studyConductor',
    orden: 100,
    duracion: null,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder, Ministerial Servant',
  },
  {
    seccion: Section.CHRISTIAN_LIFE,
    tipo: PartType.READING,
    tituloKey: 'meetings.parts.studyReader',
    orden: 101,
    duracion: null,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder, Ministerial Servant, Baptized male',
  },

  // ── CLOSING ──
  {
    seccion: Section.CLOSING,
    tipo: PartType.PRAYER,
    tituloKey: 'meetings.parts.closingPrayer',
    orden: 1,
    duracion: null,
    sala: Room.MAIN,
    requiereAyudante: false,
    onlyIfAuxiliary: false,
    eligibility: 'Elder, Ministerial Servant, Baptized male',
  },
] as const;
