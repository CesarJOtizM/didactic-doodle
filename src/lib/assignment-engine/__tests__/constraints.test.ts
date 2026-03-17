import { describe, it, expect } from 'vitest';
import {
  Gender,
  Role,
  PublisherStatus,
  Section,
  PartType,
  Room,
} from '@/generated/prisma/enums';
import type { PublisherCandidate, PartSlot, SlotAssignment } from '../types';
import {
  isAlreadyAssigned,
  isExclusive,
  hasRoomConflict,
  isTitularAndHelper,
  applyConstraints,
  applyHelperConstraints,
} from '../constraints';

// ─── Factories ────────────────────────────────────────────────────────

function makePublisher(
  overrides: Partial<PublisherCandidate> = {}
): PublisherCandidate {
  return {
    id: 'pub-1',
    nombre: 'Test Publisher',
    sexo: Gender.MALE,
    rol: Role.ELDER,
    estado: PublisherStatus.ACTIVE,
    habilitadoVMC: true,
    skipAssignment: false,
    ...overrides,
  };
}

function makePart(overrides: Partial<PartSlot> = {}): PartSlot {
  return {
    id: 'part-1',
    seccion: Section.TREASURES,
    tipo: PartType.SPEECH,
    titulo: null,
    orden: 1,
    sala: Room.MAIN,
    requiereAyudante: false,
    ...overrides,
  };
}

function makeAssignment(
  overrides: Partial<SlotAssignment> = {}
): SlotAssignment {
  return {
    partId: 'part-1',
    publisherId: 'pub-1',
    publisherNombre: 'Test Publisher',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('isAlreadyAssigned', () => {
  it('returns true when publisher is assigned as titular', () => {
    const assignments = [makeAssignment({ publisherId: 'pub-A' })];
    expect(isAlreadyAssigned('pub-A', assignments)).toBe(true);
  });

  it('returns true when publisher is assigned as helper', () => {
    const assignments = [
      makeAssignment({ publisherId: 'pub-X', helperId: 'pub-A' }),
    ];
    expect(isAlreadyAssigned('pub-A', assignments)).toBe(true);
  });

  it('returns false when publisher is not assigned at all', () => {
    const assignments = [makeAssignment({ publisherId: 'pub-X' })];
    expect(isAlreadyAssigned('pub-A', assignments)).toBe(false);
  });

  it('returns false for empty assignments list', () => {
    expect(isAlreadyAssigned('pub-A', [])).toBe(false);
  });
});

describe('isExclusive', () => {
  const presidentePart = makePart({
    id: 'part-presidente',
    tituloKey: 'meetings.parts.presidente',
    seccion: Section.OPENING,
  });
  const encargadoPart = makePart({
    id: 'part-encargado',
    tituloKey: 'meetings.parts.schoolOverseer',
    seccion: Section.MINISTRY_SCHOOL,
  });
  const regularPart = makePart({
    id: 'part-tesoros',
    tituloKey: 'meetings.parts.treasuresDiscourse',
  });

  const allParts = [presidentePart, encargadoPart, regularPart];

  it('returns true when publisher is assigned as Presidente', () => {
    const assignments = [
      makeAssignment({ partId: 'part-presidente', publisherId: 'pub-A' }),
    ];
    expect(isExclusive('pub-A', assignments, allParts)).toBe(true);
  });

  it('returns true when publisher is assigned as Encargado de escuela', () => {
    const assignments = [
      makeAssignment({ partId: 'part-encargado', publisherId: 'pub-A' }),
    ];
    expect(isExclusive('pub-A', assignments, allParts)).toBe(true);
  });

  it('returns false when publisher is assigned to a non-exclusive part', () => {
    const assignments = [
      makeAssignment({ partId: 'part-tesoros', publisherId: 'pub-A' }),
    ];
    expect(isExclusive('pub-A', assignments, allParts)).toBe(false);
  });

  it('returns false when publisher is not assigned at all', () => {
    const assignments = [
      makeAssignment({ partId: 'part-presidente', publisherId: 'pub-B' }),
    ];
    expect(isExclusive('pub-A', assignments, allParts)).toBe(false);
  });
});

describe('hasRoomConflict', () => {
  const lecturaMain = makePart({
    id: 'lectura-main',
    seccion: Section.TREASURES,
    tipo: PartType.READING,
    sala: Room.MAIN,
    tituloKey: 'meetings.parts.bibleReading',
  });
  const lecturaAux = makePart({
    id: 'lectura-aux',
    seccion: Section.TREASURES,
    tipo: PartType.READING,
    sala: Room.AUXILIARY_1,
    tituloKey: 'meetings.parts.bibleReadingAux',
  });
  const smmMainDemo = makePart({
    id: 'smm-main',
    seccion: Section.MINISTRY_SCHOOL,
    tipo: PartType.DEMONSTRATION,
    sala: Room.MAIN,
  });
  const smmAuxDemo = makePart({
    id: 'smm-aux',
    seccion: Section.MINISTRY_SCHOOL,
    tipo: PartType.DEMONSTRATION,
    sala: Room.AUXILIARY_1,
  });

  const allParts = [lecturaMain, lecturaAux, smmMainDemo, smmAuxDemo];

  it('detects room conflict for bible reading (main assigned, checking aux)', () => {
    const assignments = [
      makeAssignment({ partId: 'lectura-main', publisherId: 'pub-A' }),
    ];
    expect(hasRoomConflict('pub-A', lecturaAux, assignments, allParts)).toBe(
      true
    );
  });

  it('detects room conflict for dynamic SMM parts in different rooms', () => {
    const assignments = [
      makeAssignment({ partId: 'smm-main', publisherId: 'pub-A' }),
    ];
    expect(hasRoomConflict('pub-A', smmAuxDemo, assignments, allParts)).toBe(
      true
    );
  });

  it('no conflict when same room', () => {
    // Two different parts in MAIN room — not a room conflict
    const tesorosPart = makePart({
      id: 'tesoros',
      seccion: Section.TREASURES,
      tipo: PartType.SPEECH,
      sala: Room.MAIN,
      tituloKey: 'meetings.parts.treasuresDiscourse',
    });
    const assignments = [
      makeAssignment({ partId: 'lectura-main', publisherId: 'pub-A' }),
    ];
    expect(
      hasRoomConflict('pub-A', tesorosPart, assignments, [
        ...allParts,
        tesorosPart,
      ])
    ).toBe(false);
  });

  it('no conflict when publisher is not in the assignments', () => {
    const assignments = [
      makeAssignment({ partId: 'lectura-main', publisherId: 'pub-B' }),
    ];
    expect(hasRoomConflict('pub-A', lecturaAux, assignments, allParts)).toBe(
      false
    );
  });

  it('detects conflict when publisher is helper in another room', () => {
    const assignments = [
      makeAssignment({
        partId: 'smm-main',
        publisherId: 'pub-X',
        helperId: 'pub-A',
      }),
    ];
    expect(hasRoomConflict('pub-A', smmAuxDemo, assignments, allParts)).toBe(
      true
    );
  });
});

describe('isTitularAndHelper', () => {
  it('returns true when checking helper role and publisher is already a titular', () => {
    const assignments = [makeAssignment({ publisherId: 'pub-A' })];
    expect(isTitularAndHelper('pub-A', 'helper', assignments)).toBe(true);
  });

  it('returns true when checking titular role and publisher is already a helper', () => {
    const assignments = [
      makeAssignment({ publisherId: 'pub-X', helperId: 'pub-A' }),
    ];
    expect(isTitularAndHelper('pub-A', 'titular', assignments)).toBe(true);
  });

  it('returns false when publisher has no assignments', () => {
    expect(isTitularAndHelper('pub-A', 'helper', [])).toBe(false);
    expect(isTitularAndHelper('pub-A', 'titular', [])).toBe(false);
  });

  it('returns false when checking helper role and publisher is not a titular', () => {
    const assignments = [makeAssignment({ publisherId: 'pub-B' })];
    expect(isTitularAndHelper('pub-A', 'helper', assignments)).toBe(false);
  });
});

describe('applyConstraints (composite)', () => {
  const presidentePart = makePart({
    id: 'part-presidente',
    tituloKey: 'meetings.parts.presidente',
    seccion: Section.OPENING,
  });
  const tesorosPart = makePart({
    id: 'part-tesoros',
    tituloKey: 'meetings.parts.treasuresDiscourse',
    seccion: Section.TREASURES,
  });
  const allParts = [presidentePart, tesorosPart];

  const pubA = makePublisher({ id: 'pub-A', nombre: 'Publisher A' });
  const pubB = makePublisher({ id: 'pub-B', nombre: 'Publisher B' });
  const pubC = makePublisher({ id: 'pub-C', nombre: 'Publisher C' });

  it('removes already-assigned publishers', () => {
    const assignments = [
      makeAssignment({ partId: 'part-tesoros', publisherId: 'pub-A' }),
    ];
    const result = applyConstraints(
      [pubA, pubB],
      presidentePart,
      assignments,
      allParts
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pub-B');
  });

  it('removes publisher with exclusive role (Presidente)', () => {
    const assignments = [
      makeAssignment({ partId: 'part-presidente', publisherId: 'pub-A' }),
    ];
    const result = applyConstraints(
      [pubA, pubB],
      tesorosPart,
      assignments,
      allParts
    );
    // pub-A is excluded by both isAlreadyAssigned AND isExclusive
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pub-B');
  });

  it('returns all candidates when no constraints violated', () => {
    const result = applyConstraints(
      [pubA, pubB, pubC],
      tesorosPart,
      [],
      allParts
    );
    expect(result).toHaveLength(3);
  });
});

describe('applyHelperConstraints', () => {
  const smmPart = makePart({
    id: 'smm-1',
    seccion: Section.MINISTRY_SCHOOL,
    tipo: PartType.DEMONSTRATION,
    sala: Room.MAIN,
    requiereAyudante: true,
  });
  const allParts = [smmPart];

  const pubA = makePublisher({ id: 'pub-A', nombre: 'Titular' });
  const pubB = makePublisher({ id: 'pub-B', nombre: 'Potential Helper' });
  const pubC = makePublisher({
    id: 'pub-C',
    nombre: 'Another Helper',
    sexo: Gender.FEMALE,
    rol: Role.BAPTIZED_PUBLISHER,
  });

  it('excludes the titular from helper candidates', () => {
    const assignments = [
      makeAssignment({ partId: 'smm-1', publisherId: 'pub-A' }),
    ];
    const result = applyHelperConstraints(
      [pubA, pubB],
      smmPart,
      'pub-A',
      assignments,
      allParts
    );
    // pub-A excluded as titular, pub-B excluded as already assigned (isAlreadyAssigned checks titular match)
    // Wait — pub-B is NOT assigned. Let me trace: assignments has pub-A as titular for smm-1.
    // isAlreadyAssigned('pub-B', assignments) → false (pub-B not in any assignment)
    // So pub-B should pass.
    expect(result.find((p) => p.id === 'pub-A')).toBeUndefined();
  });

  it('excludes publishers already assigned as titulares (titular+helper conflict)', () => {
    const otherPart = makePart({
      id: 'other-part',
      seccion: Section.TREASURES,
      tipo: PartType.SPEECH,
    });
    const assignments = [
      makeAssignment({ partId: 'smm-1', publisherId: 'pub-A' }),
      makeAssignment({ partId: 'other-part', publisherId: 'pub-B' }),
    ];
    const result = applyHelperConstraints(
      [pubA, pubB, pubC],
      smmPart,
      'pub-A',
      assignments,
      [smmPart, otherPart]
    );
    // pub-A: excluded (is titular)
    // pub-B: excluded (already assigned as titular of other-part → isAlreadyAssigned + isTitularAndHelper)
    // pub-C: should pass (not assigned anywhere)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pub-C');
  });
});
