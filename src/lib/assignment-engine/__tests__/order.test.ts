import { describe, it, expect } from 'vitest';
import { Section, PartType, Room } from '@/generated/prisma/enums';
import type { PartSlot } from '../types';
import { getAssignmentOrder } from '../order';

// ─── Factories ────────────────────────────────────────────────────────

function makePart(overrides: Partial<PartSlot> = {}): PartSlot {
  return {
    id: 'part-default',
    seccion: Section.OPENING,
    tipo: PartType.SPEECH,
    titulo: null,
    orden: 1,
    sala: Room.MAIN,
    requiereAyudante: false,
    ...overrides,
  };
}

// ─── Build a complete meeting week's parts (shuffled) ─────────────────

function buildAllParts(): PartSlot[] {
  return [
    // Intentionally scrambled order to test sorting
    makePart({
      id: 'closing-prayer',
      tituloKey: 'meetings.parts.closingPrayer',
      seccion: Section.CLOSING,
      tipo: PartType.PRAYER,
      orden: 1,
    }),
    makePart({
      id: 'smm-demo-aux',
      seccion: Section.MINISTRY_SCHOOL,
      tipo: PartType.DEMONSTRATION,
      titulo: 'Revisita Aux',
      orden: 3,
      sala: Room.AUXILIARY_1,
      requiereAyudante: true,
    }),
    makePart({
      id: 'bible-reading-main',
      tituloKey: 'meetings.parts.bibleReading',
      seccion: Section.TREASURES,
      tipo: PartType.READING,
      orden: 3,
    }),
    makePart({
      id: 'nvc-talk',
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.SPEECH,
      titulo: 'NVC Talk 1',
      orden: 1,
    }),
    makePart({
      id: 'presidente',
      tituloKey: 'meetings.parts.presidente',
      seccion: Section.OPENING,
      tipo: PartType.SPEECH,
      orden: 1,
    }),
    makePart({
      id: 'study-reader',
      tituloKey: 'meetings.parts.studyReader',
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.READING,
      orden: 101,
    }),
    makePart({
      id: 'smm-demo-main',
      seccion: Section.MINISTRY_SCHOOL,
      tipo: PartType.DEMONSTRATION,
      titulo: 'Revisita Main',
      orden: 2,
      requiereAyudante: true,
    }),
    makePart({
      id: 'opening-prayer',
      tituloKey: 'meetings.parts.openingPrayer',
      seccion: Section.OPENING,
      tipo: PartType.PRAYER,
      orden: 2,
    }),
    makePart({
      id: 'school-overseer',
      tituloKey: 'meetings.parts.schoolOverseer',
      seccion: Section.MINISTRY_SCHOOL,
      tipo: PartType.SPEECH,
      orden: 1,
    }),
    makePart({
      id: 'study-conductor',
      tituloKey: 'meetings.parts.studyConductor',
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.STUDY,
      orden: 100,
    }),
    makePart({
      id: 'pearls',
      tituloKey: 'meetings.parts.pearls',
      seccion: Section.TREASURES,
      tipo: PartType.DISCUSSION,
      orden: 2,
    }),
    makePart({
      id: 'bible-reading-aux',
      tituloKey: 'meetings.parts.bibleReadingAux',
      seccion: Section.TREASURES,
      tipo: PartType.READING,
      orden: 4,
      sala: Room.AUXILIARY_1,
    }),
    makePart({
      id: 'treasures-discourse',
      tituloKey: 'meetings.parts.treasuresDiscourse',
      seccion: Section.TREASURES,
      tipo: PartType.SPEECH,
      orden: 1,
    }),
  ];
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('getAssignmentOrder', () => {
  it('sorts parts by RF-AUTO-05 priority', () => {
    const parts = buildAllParts();
    const ordered = getAssignmentOrder(parts);
    const ids = ordered.map((p) => p.id);

    // Expected order based on priority map:
    // 0: presidente
    // 1: school-overseer
    // 2: opening-prayer
    // 3: treasures-discourse, pearls (same priority, both MAIN, ordered by `orden`)
    // 4: nvc-talk (dynamic CHRISTIAN_LIFE)
    // 5: study-conductor
    // 6: study-reader
    // 7: bible-reading-main (MAIN first), bible-reading-aux (AUX second)
    // 8: smm-demo-main (SMM MAIN)
    // 9: smm-demo-aux (SMM AUX)
    // 12: closing-prayer

    expect(ids).toEqual([
      'presidente',
      'school-overseer',
      'opening-prayer',
      'treasures-discourse',
      'pearls',
      'nvc-talk',
      'study-conductor',
      'study-reader',
      'bible-reading-main',
      'bible-reading-aux',
      'smm-demo-main',
      'smm-demo-aux',
      'closing-prayer',
    ]);
  });

  it('places Presidente first (most restrictive — Elder only)', () => {
    const parts = buildAllParts();
    const ordered = getAssignmentOrder(parts);
    expect(ordered[0].id).toBe('presidente');
  });

  it('places Oración de conclusión last', () => {
    const parts = buildAllParts();
    const ordered = getAssignmentOrder(parts);
    expect(ordered[ordered.length - 1].id).toBe('closing-prayer');
  });

  it('places MAIN room before AUXILIARY for same logical part', () => {
    const parts = buildAllParts();
    const ordered = getAssignmentOrder(parts);
    const ids = ordered.map((p) => p.id);

    const bibleMainIdx = ids.indexOf('bible-reading-main');
    const bibleAuxIdx = ids.indexOf('bible-reading-aux');
    expect(bibleMainIdx).toBeLessThan(bibleAuxIdx);

    const smmMainIdx = ids.indexOf('smm-demo-main');
    const smmAuxIdx = ids.indexOf('smm-demo-aux');
    expect(smmMainIdx).toBeLessThan(smmAuxIdx);
  });

  it('does not mutate the original array', () => {
    const parts = buildAllParts();
    const originalIds = parts.map((p) => p.id);
    getAssignmentOrder(parts);
    expect(parts.map((p) => p.id)).toEqual(originalIds);
  });

  it('handles empty input', () => {
    expect(getAssignmentOrder([])).toEqual([]);
  });

  it('handles single part', () => {
    const parts = [makePart({ id: 'solo' })];
    expect(getAssignmentOrder(parts)).toHaveLength(1);
  });

  it('sorts parts with same priority by orden within same room', () => {
    const parts = [
      makePart({
        id: 'pearls',
        tituloKey: 'meetings.parts.pearls',
        seccion: Section.TREASURES,
        tipo: PartType.DISCUSSION,
        orden: 2,
      }),
      makePart({
        id: 'treasures-discourse',
        tituloKey: 'meetings.parts.treasuresDiscourse',
        seccion: Section.TREASURES,
        tipo: PartType.SPEECH,
        orden: 1,
      }),
    ];
    const ordered = getAssignmentOrder(parts);
    expect(ordered[0].id).toBe('treasures-discourse');
    expect(ordered[1].id).toBe('pearls');
  });
});
