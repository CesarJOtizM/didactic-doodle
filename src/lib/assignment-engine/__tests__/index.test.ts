import { describe, it, expect } from 'vitest';
import {
  Gender,
  Role,
  PublisherStatus,
  Section,
  PartType,
  Room,
} from '@/generated/prisma/enums';
import type {
  PublisherCandidate,
  PartSlot,
  RotationMap,
  ExistingAssignment,
} from '../types';
import { generateAssignments } from '../index';

// ─── Factories ────────────────────────────────────────────────────────

let idCounter = 0;

function makePublisher(
  overrides: Partial<PublisherCandidate> = {}
): PublisherCandidate {
  idCounter++;
  return {
    id: `pub-${idCounter}`,
    nombre: `Publisher ${idCounter}`,
    sexo: Gender.MALE,
    rol: Role.ELDER,
    estado: PublisherStatus.ACTIVE,
    habilitadoVMC: true,
    skipAssignment: false,
    ...overrides,
  };
}

function makePart(overrides: Partial<PartSlot> = {}): PartSlot {
  idCounter++;
  return {
    id: `part-${idCounter}`,
    seccion: Section.TREASURES,
    tipo: PartType.SPEECH,
    titulo: null,
    orden: 1,
    sala: Room.MAIN,
    requiereAyudante: false,
    ...overrides,
  };
}

function makeRotationMap(entries: [string, string, Date][]): RotationMap {
  const map: RotationMap = new Map();
  for (const [publisherId, eligKey, date] of entries) {
    if (!map.has(publisherId)) {
      map.set(publisherId, new Map());
    }
    map.get(publisherId)!.set(eligKey, date);
  }
  return map;
}

// ─── Realistic publisher pool ─────────────────────────────────────────

function buildPublisherPool(): PublisherCandidate[] {
  return [
    // 3 Elders
    makePublisher({
      id: 'elder-1',
      nombre: 'Elder 1',
      rol: Role.ELDER,
      sexo: Gender.MALE,
    }),
    makePublisher({
      id: 'elder-2',
      nombre: 'Elder 2',
      rol: Role.ELDER,
      sexo: Gender.MALE,
    }),
    makePublisher({
      id: 'elder-3',
      nombre: 'Elder 3',
      rol: Role.ELDER,
      sexo: Gender.MALE,
    }),
    // 4 Ministerial Servants
    makePublisher({
      id: 'ms-1',
      nombre: 'MS 1',
      rol: Role.MINISTERIAL_SERVANT,
      sexo: Gender.MALE,
    }),
    makePublisher({
      id: 'ms-2',
      nombre: 'MS 2',
      rol: Role.MINISTERIAL_SERVANT,
      sexo: Gender.MALE,
    }),
    makePublisher({
      id: 'ms-3',
      nombre: 'MS 3',
      rol: Role.MINISTERIAL_SERVANT,
      sexo: Gender.MALE,
    }),
    makePublisher({
      id: 'ms-4',
      nombre: 'MS 4',
      rol: Role.MINISTERIAL_SERVANT,
      sexo: Gender.MALE,
    }),
    // 3 Baptized males
    makePublisher({
      id: 'bp-m-1',
      nombre: 'Baptized Male 1',
      rol: Role.BAPTIZED_PUBLISHER,
      sexo: Gender.MALE,
    }),
    makePublisher({
      id: 'bp-m-2',
      nombre: 'Baptized Male 2',
      rol: Role.BAPTIZED_PUBLISHER,
      sexo: Gender.MALE,
    }),
    makePublisher({
      id: 'bp-m-3',
      nombre: 'Baptized Male 3',
      rol: Role.BAPTIZED_PUBLISHER,
      sexo: Gender.MALE,
    }),
    // 1 Unbaptized male
    makePublisher({
      id: 'ub-m-1',
      nombre: 'Unbaptized Male 1',
      rol: Role.UNBAPTIZED_PUBLISHER,
      sexo: Gender.MALE,
    }),
    // 2 Baptized females
    makePublisher({
      id: 'bp-f-1',
      nombre: 'Baptized Female 1',
      rol: Role.BAPTIZED_PUBLISHER,
      sexo: Gender.FEMALE,
    }),
    makePublisher({
      id: 'bp-f-2',
      nombre: 'Baptized Female 2',
      rol: Role.BAPTIZED_PUBLISHER,
      sexo: Gender.FEMALE,
    }),
  ];
}

// ─── Realistic parts for a meeting week ───────────────────────────────

function buildMeetingParts(): PartSlot[] {
  return [
    // OPENING
    makePart({
      id: 'presidente',
      tituloKey: 'meetings.parts.presidente',
      seccion: Section.OPENING,
      tipo: PartType.SPEECH,
      orden: 1,
    }),
    makePart({
      id: 'opening-prayer',
      tituloKey: 'meetings.parts.openingPrayer',
      seccion: Section.OPENING,
      tipo: PartType.PRAYER,
      orden: 2,
    }),

    // TREASURES
    makePart({
      id: 'treasures-discourse',
      tituloKey: 'meetings.parts.treasuresDiscourse',
      seccion: Section.TREASURES,
      tipo: PartType.SPEECH,
      orden: 1,
    }),
    makePart({
      id: 'pearls',
      tituloKey: 'meetings.parts.pearls',
      seccion: Section.TREASURES,
      tipo: PartType.DISCUSSION,
      orden: 2,
    }),
    makePart({
      id: 'bible-reading',
      tituloKey: 'meetings.parts.bibleReading',
      seccion: Section.TREASURES,
      tipo: PartType.READING,
      orden: 3,
    }),

    // MINISTRY_SCHOOL
    makePart({
      id: 'school-overseer',
      tituloKey: 'meetings.parts.schoolOverseer',
      seccion: Section.MINISTRY_SCHOOL,
      tipo: PartType.SPEECH,
      orden: 1,
    }),
    makePart({
      id: 'smm-demo-1',
      seccion: Section.MINISTRY_SCHOOL,
      tipo: PartType.DEMONSTRATION,
      titulo: 'Primera revisita',
      orden: 2,
      requiereAyudante: true,
    }),

    // CHRISTIAN_LIFE
    makePart({
      id: 'nvc-talk',
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.SPEECH,
      titulo: 'NVC Talk',
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
      id: 'study-reader',
      tituloKey: 'meetings.parts.studyReader',
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.READING,
      orden: 101,
    }),

    // CLOSING
    makePart({
      id: 'closing-prayer',
      tituloKey: 'meetings.parts.closingPrayer',
      seccion: Section.CLOSING,
      tipo: PartType.PRAYER,
      orden: 1,
    }),
  ];
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('generateAssignments — full mode', () => {
  const SEED = 42;

  it('fills all slots with a sufficient publisher pool', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    expect(result.unfilled).toHaveLength(0);
    expect(result.assignments).toHaveLength(parts.length);
    expect(result.stats.totalSlots).toBe(parts.length);
    expect(result.stats.filled).toBe(parts.length);
    expect(result.stats.skipped).toBe(0);
  });

  it('assigns no duplicate publishers (one part per person)', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    const assignedPublisherIds = result.assignments.map((a) => a.publisherId);
    const uniqueIds = new Set(assignedPublisherIds);
    expect(uniqueIds.size).toBe(assignedPublisherIds.length);
  });

  it('assigns Presidente to an Elder', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    const presidenteAssignment = result.assignments.find(
      (a) => a.partId === 'presidente'
    );
    expect(presidenteAssignment).toBeDefined();
    const assignedPublisher = publishers.find(
      (p) => p.id === presidenteAssignment!.publisherId
    );
    expect(assignedPublisher!.rol).toBe(Role.ELDER);
  });

  it('presidente only has one assignment (exclusive)', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    const presidenteAssignment = result.assignments.find(
      (a) => a.partId === 'presidente'
    );
    const presidenteId = presidenteAssignment!.publisherId;

    // Presidente should not appear in any other assignment
    const otherAssignments = result.assignments.filter(
      (a) =>
        a.partId !== 'presidente' &&
        (a.publisherId === presidenteId || a.helperId === presidenteId)
    );
    expect(otherAssignments).toHaveLength(0);
  });

  it('encargado de escuela only has one assignment (exclusive)', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    const encargadoAssignment = result.assignments.find(
      (a) => a.partId === 'school-overseer'
    );
    expect(encargadoAssignment).toBeDefined();
    const encargadoId = encargadoAssignment!.publisherId;

    const otherAssignments = result.assignments.filter(
      (a) =>
        a.partId !== 'school-overseer' &&
        (a.publisherId === encargadoId || a.helperId === encargadoId)
    );
    expect(otherAssignments).toHaveLength(0);
  });

  it('assigns helper for parts with requiereAyudante', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    const smmAssignment = result.assignments.find(
      (a) => a.partId === 'smm-demo-1'
    );
    expect(smmAssignment).toBeDefined();
    expect(smmAssignment!.helperId).toBeDefined();
    expect(smmAssignment!.helperNombre).toBeDefined();
  });

  it('helper is different from titular', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    const smmAssignment = result.assignments.find(
      (a) => a.partId === 'smm-demo-1'
    );
    expect(smmAssignment!.publisherId).not.toBe(smmAssignment!.helperId);
  });

  it('produces deterministic output with same seed', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const result1 = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });
    const result2 = generateAssignments(parts, publishers, rotationMap, [], {
      mode: 'full',
      seed: SEED,
    });

    expect(result1.assignments.map((a) => a.publisherId)).toEqual(
      result2.assignments.map((a) => a.publisherId)
    );
  });
});

describe('generateAssignments — partial mode', () => {
  const SEED = 42;

  it('skips parts that already have assignments', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    // Pre-assign presidente and opening prayer
    const existing: ExistingAssignment[] = [
      { partId: 'presidente', publisherId: 'elder-1', helperId: null },
      { partId: 'opening-prayer', publisherId: 'ms-1', helperId: null },
    ];

    const result = generateAssignments(
      parts,
      publishers,
      rotationMap,
      existing,
      {
        mode: 'partial',
        seed: SEED,
      }
    );

    expect(result.stats.skipped).toBe(2);
    // Total assignments = existing (2) + newly filled (9)
    expect(result.assignments.length).toBe(parts.length);
  });

  it('preserves existing assignments in the output', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    const existing: ExistingAssignment[] = [
      { partId: 'presidente', publisherId: 'elder-1', helperId: null },
    ];

    const result = generateAssignments(
      parts,
      publishers,
      rotationMap,
      existing,
      {
        mode: 'partial',
        seed: SEED,
      }
    );

    const presidenteAssignment = result.assignments.find(
      (a) => a.partId === 'presidente'
    );
    expect(presidenteAssignment).toBeDefined();
    expect(presidenteAssignment!.publisherId).toBe('elder-1');
  });

  it('respects existing assignments as constraints for new assignments', () => {
    const parts = buildMeetingParts();
    const publishers = buildPublisherPool();
    const rotationMap: RotationMap = new Map();

    // Elder-1 is already assigned as presidente
    const existing: ExistingAssignment[] = [
      { partId: 'presidente', publisherId: 'elder-1', helperId: null },
    ];

    const result = generateAssignments(
      parts,
      publishers,
      rotationMap,
      existing,
      {
        mode: 'partial',
        seed: SEED,
      }
    );

    // Elder-1 should NOT appear in any other assignment (exclusive presidente rule)
    const otherAssignments = result.assignments.filter(
      (a) =>
        a.partId !== 'presidente' &&
        (a.publisherId === 'elder-1' || a.helperId === 'elder-1')
    );
    expect(otherAssignments).toHaveLength(0);
  });
});

describe('generateAssignments — no candidate scenarios', () => {
  const SEED = 42;

  it('reports unfilled slots when no eligible candidates exist', () => {
    const parts = [
      makePart({
        id: 'presidente',
        tituloKey: 'meetings.parts.presidente',
        seccion: Section.OPENING,
        tipo: PartType.SPEECH,
        orden: 1,
      }),
    ];

    // Only ministerial servants — no Elders for presidente
    const publishers = [
      makePublisher({ id: 'ms-1', rol: Role.MINISTERIAL_SERVANT }),
      makePublisher({ id: 'ms-2', rol: Role.MINISTERIAL_SERVANT }),
    ];

    const result = generateAssignments(parts, publishers, new Map(), [], {
      mode: 'full',
      seed: SEED,
    });

    expect(result.unfilled).toHaveLength(1);
    expect(result.unfilled[0].partId).toBe('presidente');
    expect(result.unfilled[0].reason).toContain('No eligible candidates');
    expect(result.stats.unfilled).toBe(1);
    expect(result.stats.filled).toBe(0);
  });

  it('reports unfilled when all eligible candidates are already assigned', () => {
    // Only 1 Elder, needs 2 Elder-only slots
    const parts = [
      makePart({
        id: 'presidente',
        tituloKey: 'meetings.parts.presidente',
        seccion: Section.OPENING,
        tipo: PartType.SPEECH,
        orden: 1,
      }),
      makePart({
        id: 'school-overseer',
        tituloKey: 'meetings.parts.schoolOverseer',
        seccion: Section.MINISTRY_SCHOOL,
        tipo: PartType.SPEECH,
        orden: 1,
      }),
    ];

    const publishers = [makePublisher({ id: 'elder-solo', rol: Role.ELDER })];

    const result = generateAssignments(parts, publishers, new Map(), [], {
      mode: 'full',
      seed: SEED,
    });

    // Presidente assigned (first in priority), school-overseer unfilled
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].partId).toBe('presidente');
    expect(result.unfilled).toHaveLength(1);
    expect(result.unfilled[0].partId).toBe('school-overseer');
    expect(result.unfilled[0].reason).toContain(
      'already assigned or constrained'
    );
  });

  it('reports correct stats with mixed filled/unfilled', () => {
    const parts = buildMeetingParts();
    // Only females — can only fill SMM demonstration parts
    const publishers = [
      makePublisher({
        id: 'f-1',
        nombre: 'Female 1',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
      makePublisher({
        id: 'f-2',
        nombre: 'Female 2',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
    ];

    const result = generateAssignments(parts, publishers, new Map(), [], {
      mode: 'full',
      seed: SEED,
    });

    // Most parts require males/elders — should have many unfilled
    expect(result.unfilled.length).toBeGreaterThan(0);
    expect(result.stats.totalSlots).toBe(parts.length);
    expect(result.stats.filled + result.stats.unfilled).toBe(parts.length);
  });
});

describe('generateAssignments — helper assignment', () => {
  const SEED = 42;

  it('assigns helpers for parts with requiereAyudante=true', () => {
    const parts = [
      makePart({
        id: 'smm-demo',
        seccion: Section.MINISTRY_SCHOOL,
        tipo: PartType.DEMONSTRATION,
        titulo: 'Demo 1',
        orden: 2,
        requiereAyudante: true,
      }),
    ];

    const publishers = [
      makePublisher({
        id: 'pub-titular',
        nombre: 'Titular',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
      makePublisher({
        id: 'pub-helper',
        nombre: 'Helper',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
    ];

    const result = generateAssignments(parts, publishers, new Map(), [], {
      mode: 'full',
      seed: SEED,
    });

    expect(result.assignments).toHaveLength(1);
    const assignment = result.assignments[0];
    expect(assignment.helperId).toBeDefined();
    expect(assignment.publisherId).not.toBe(assignment.helperId);
  });

  it('does not assign helper when no eligible candidates remain', () => {
    const parts = [
      makePart({
        id: 'smm-demo',
        seccion: Section.MINISTRY_SCHOOL,
        tipo: PartType.DEMONSTRATION,
        titulo: 'Demo 1',
        orden: 2,
        requiereAyudante: true,
      }),
    ];

    // Only 1 publisher — will be titular, no one left for helper
    const publishers = [
      makePublisher({
        id: 'solo-pub',
        nombre: 'Solo',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
    ];

    const result = generateAssignments(parts, publishers, new Map(), [], {
      mode: 'full',
      seed: SEED,
    });

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].helperId).toBeUndefined();
  });

  it('does not assign same person as both titular and helper', () => {
    const parts = [
      makePart({
        id: 'smm-demo-1',
        seccion: Section.MINISTRY_SCHOOL,
        tipo: PartType.DEMONSTRATION,
        titulo: 'Demo 1',
        orden: 2,
        requiereAyudante: true,
      }),
      makePart({
        id: 'smm-demo-2',
        seccion: Section.MINISTRY_SCHOOL,
        tipo: PartType.DEMONSTRATION,
        titulo: 'Demo 2',
        orden: 3,
        requiereAyudante: true,
      }),
    ];

    const publishers = [
      makePublisher({
        id: 'f-1',
        nombre: 'Female 1',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
      makePublisher({
        id: 'f-2',
        nombre: 'Female 2',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
      makePublisher({
        id: 'f-3',
        nombre: 'Female 3',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
      makePublisher({
        id: 'f-4',
        nombre: 'Female 4',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      }),
    ];

    const result = generateAssignments(parts, publishers, new Map(), [], {
      mode: 'full',
      seed: SEED,
    });

    // Collect all IDs used
    const allIds: string[] = [];
    for (const a of result.assignments) {
      allIds.push(a.publisherId);
      if (a.helperId) allIds.push(a.helperId);
    }

    // No person should appear more than once
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});

describe('generateAssignments — rotation integration', () => {
  const SEED = 42;

  it('prefers publishers with older last-assignment dates', () => {
    const parts = [
      makePart({
        id: 'treasures',
        tituloKey: 'meetings.parts.treasuresDiscourse',
        seccion: Section.TREASURES,
        tipo: PartType.SPEECH,
        orden: 1,
      }),
    ];

    const pubRecent = makePublisher({
      id: 'recent',
      nombre: 'Recently Assigned',
      rol: Role.ELDER,
    });
    const pubOld = makePublisher({
      id: 'old',
      nombre: 'Long Ago',
      rol: Role.ELDER,
    });

    const rotationMap = makeRotationMap([
      ['recent', 'meetings.parts.treasuresDiscourse', new Date('2024-06-01')],
      ['old', 'meetings.parts.treasuresDiscourse', new Date('2024-01-01')],
    ]);

    const result = generateAssignments(
      parts,
      [pubRecent, pubOld],
      rotationMap,
      [],
      {
        mode: 'full',
        seed: SEED,
      }
    );

    expect(result.assignments[0].publisherId).toBe('old');
  });
});

describe('generateAssignments — edge cases', () => {
  const SEED = 42;

  it('handles empty parts list', () => {
    const result = generateAssignments(
      [],
      buildPublisherPool(),
      new Map(),
      [],
      {
        mode: 'full',
        seed: SEED,
      }
    );

    expect(result.assignments).toHaveLength(0);
    expect(result.unfilled).toHaveLength(0);
    expect(result.stats.totalSlots).toBe(0);
  });

  it('handles empty publishers list', () => {
    const parts = buildMeetingParts();
    const result = generateAssignments(parts, [], new Map(), [], {
      mode: 'full',
      seed: SEED,
    });

    expect(result.assignments).toHaveLength(0);
    expect(result.unfilled).toHaveLength(parts.length);
  });
});
