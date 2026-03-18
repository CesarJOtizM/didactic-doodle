import { describe, it, expect } from 'vitest';
import { Gender, Role, PublisherStatus } from '@/generated/prisma/enums';
import type {
  WeekendCandidate,
  WeekendExisting,
  WeekendRotationMap,
  WeekendEngineConfig,
} from '../weekend-engine';
import { generateWeekendAssignments } from '../weekend-engine';

// ─── Factories ────────────────────────────────────────────────────────

function makeCandidate(
  overrides: Partial<WeekendCandidate> = {}
): WeekendCandidate {
  return {
    id: 'pub-1',
    nombre: 'Test Publisher',
    sexo: Gender.MALE,
    rol: Role.ELDER,
    estado: PublisherStatus.ACTIVE,
    habilitadoVMC: true,
    habilitadoOracion: true,
    habilitadoLectura: true,
    habilitadoPresidenciaFinDeSemana: true,
    habilitadoConductorAtalaya: true,
    skipAssignment: false,
    ...overrides,
  };
}

function makeExisting(
  overrides: Partial<WeekendExisting> = {}
): WeekendExisting {
  return {
    presidenteId: null,
    conductorId: null,
    lectorId: null,
    oracionFinalId: null,
    ...overrides,
  };
}

function makeRotationMap(
  entries: [string, string, Date][]
): WeekendRotationMap {
  const map: WeekendRotationMap = new Map();
  for (const [publisherId, slot, date] of entries) {
    if (!map.has(publisherId)) {
      map.set(publisherId, new Map());
    }
    map.get(publisherId)!.set(slot, date);
  }
  return map;
}

const FULL_CONFIG: WeekendEngineConfig = { mode: 'full', seed: 42 };
const PARTIAL_CONFIG: WeekendEngineConfig = { mode: 'partial', seed: 42 };

// ─── Pool of distinct candidates ────────────────────────────────────

function makeFullPool(): WeekendCandidate[] {
  return [
    makeCandidate({
      id: 'elder-1',
      nombre: 'Elder One',
      rol: Role.ELDER,
    }),
    makeCandidate({
      id: 'elder-2',
      nombre: 'Elder Two',
      rol: Role.ELDER,
    }),
    makeCandidate({
      id: 'ms-1',
      nombre: 'MS One',
      rol: Role.MINISTERIAL_SERVANT,
    }),
    makeCandidate({
      id: 'bp-1',
      nombre: 'Baptized One',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
    }),
    makeCandidate({
      id: 'bp-2',
      nombre: 'Baptized Two',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
    }),
  ];
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('Weekend Engine — Prerequisites (RF-WKND-01)', () => {
  it('excludes inactive publisher from all slots', () => {
    const inactive = makeCandidate({
      id: 'inactive',
      estado: PublisherStatus.ABSENT,
    });
    const result = generateWeekendAssignments(
      [inactive],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    expect(result.assignments).toHaveLength(0);
    expect(result.unfilled).toHaveLength(4);
  });

  it('excludes publisher with estado=RESTRICTED', () => {
    const restricted = makeCandidate({
      id: 'restricted',
      estado: PublisherStatus.RESTRICTED,
    });
    const result = generateWeekendAssignments(
      [restricted],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    expect(result.assignments).toHaveLength(0);
  });

  it('excludes publisher with estado=INACTIVE', () => {
    const inactive = makeCandidate({
      id: 'inactive',
      estado: PublisherStatus.INACTIVE,
    });
    const result = generateWeekendAssignments(
      [inactive],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    expect(result.assignments).toHaveLength(0);
  });

  it('excludes skip-flagged publisher from all slots', () => {
    const skipped = makeCandidate({
      id: 'skip',
      skipAssignment: true,
    });
    const result = generateWeekendAssignments(
      [skipped],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    expect(result.assignments).toHaveLength(0);
    expect(result.unfilled).toHaveLength(4);
  });

  it('includes active publisher with skipAssignment=false', () => {
    const pool = makeFullPool();
    const result = generateWeekendAssignments(
      pool,
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    expect(result.assignments.length).toBeGreaterThan(0);
  });
});

describe('Weekend Engine — Eligibility Matrix (RF-WKND-02)', () => {
  it('Elder with presidencia flag — eligible for presidente', () => {
    const elder = makeCandidate({
      id: 'elder',
      rol: Role.ELDER,
      habilitadoPresidenciaFinDeSemana: true,
    });
    const result = generateWeekendAssignments(
      [elder],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const pres = result.assignments.find((a) => a.slot === 'presidente');
    expect(pres).toBeDefined();
    expect(pres!.publisherId).toBe('elder');
  });

  it('Elder WITHOUT presidencia flag — NOT eligible for presidente', () => {
    const elder = makeCandidate({
      id: 'elder-no-flag',
      rol: Role.ELDER,
      habilitadoPresidenciaFinDeSemana: false,
    });
    const result = generateWeekendAssignments(
      [elder],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const pres = result.assignments.find((a) => a.slot === 'presidente');
    expect(pres).toBeUndefined();
    expect(result.unfilled.find((u) => u.slot === 'presidente')).toBeDefined();
  });

  it('Baptized publisher NOT eligible for presidente even with flag', () => {
    const baptized = makeCandidate({
      id: 'bp',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: true,
    });
    const result = generateWeekendAssignments(
      [baptized],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const pres = result.assignments.find((a) => a.slot === 'presidente');
    expect(pres).toBeUndefined();
  });

  it('Ministerial Servant with presidencia flag — eligible for presidente', () => {
    const ms = makeCandidate({
      id: 'ms',
      rol: Role.MINISTERIAL_SERVANT,
      habilitadoPresidenciaFinDeSemana: true,
    });
    const result = generateWeekendAssignments(
      [ms],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const pres = result.assignments.find((a) => a.slot === 'presidente');
    expect(pres).toBeDefined();
    expect(pres!.publisherId).toBe('ms');
  });

  it('Publisher with conductor flag — eligible for conductor', () => {
    // Need 2 publishers: one for presidente, one for conductor
    const elder = makeCandidate({
      id: 'elder',
      rol: Role.ELDER,
      habilitadoConductorAtalaya: false,
    });
    const conductor = makeCandidate({
      id: 'conductor',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: true,
    });
    const result = generateWeekendAssignments(
      [elder, conductor],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const cond = result.assignments.find((a) => a.slot === 'conductor');
    expect(cond).toBeDefined();
    expect(cond!.publisherId).toBe('conductor');
  });

  it('Publisher with lectura flag — eligible for lector', () => {
    const reader = makeCandidate({
      id: 'reader',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: true,
    });
    const result = generateWeekendAssignments(
      [reader],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const lect = result.assignments.find((a) => a.slot === 'lector');
    expect(lect).toBeDefined();
    expect(lect!.publisherId).toBe('reader');
  });

  it('Publisher with oracion flag — eligible for oracion cierre', () => {
    const prayer = makeCandidate({
      id: 'prayer',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: false,
      habilitadoOracion: true,
    });
    const result = generateWeekendAssignments(
      [prayer],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const oracion = result.assignments.find((a) => a.slot === 'oracionFinal');
    expect(oracion).toBeDefined();
    expect(oracion!.publisherId).toBe('prayer');
  });
});

describe('Weekend Engine — Hard Constraints (RF-WKND-03)', () => {
  it('no duplicate roles — same person cannot hold two slots', () => {
    // Single publisher eligible for all slots
    const singlePub = makeCandidate({ id: 'solo' });
    const result = generateWeekendAssignments(
      [singlePub],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    // Should only be assigned to 1 slot (presidente — first in order)
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].slot).toBe('presidente');
    expect(result.unfilled).toHaveLength(3);
  });

  it('presidente !== conductor enforced', () => {
    // 2 publishers eligible for both presidente and conductor
    const pub1 = makeCandidate({ id: 'pub-1', nombre: 'Pub 1' });
    const pub2 = makeCandidate({ id: 'pub-2', nombre: 'Pub 2' });
    const result = generateWeekendAssignments(
      [pub1, pub2],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const pres = result.assignments.find((a) => a.slot === 'presidente');
    const cond = result.assignments.find((a) => a.slot === 'conductor');
    expect(pres).toBeDefined();
    expect(cond).toBeDefined();
    expect(pres!.publisherId).not.toBe(cond!.publisherId);
  });

  it('lector !== conductor enforced', () => {
    // 3 publishers: one for presidente, two sharing conductor/lector eligibility
    const elder = makeCandidate({
      id: 'elder',
      rol: Role.ELDER,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: false,
      habilitadoOracion: false,
    });
    const pub2 = makeCandidate({
      id: 'pub-2',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: true,
      habilitadoLectura: true,
    });
    const pub3 = makeCandidate({
      id: 'pub-3',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: true,
      habilitadoLectura: true,
    });

    const result = generateWeekendAssignments(
      [elder, pub2, pub3],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );

    const cond = result.assignments.find((a) => a.slot === 'conductor');
    const lect = result.assignments.find((a) => a.slot === 'lector');
    if (cond && lect) {
      expect(cond.publisherId).not.toBe(lect.publisherId);
    }
  });

  it('oracion cierre !== presidente enforced', () => {
    // 4 publishers so all slots can be filled
    const pool = makeFullPool();
    const result = generateWeekendAssignments(
      pool,
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const pres = result.assignments.find((a) => a.slot === 'presidente');
    const oracion = result.assignments.find((a) => a.slot === 'oracionFinal');
    if (pres && oracion) {
      expect(pres.publisherId).not.toBe(oracion.publisherId);
    }
  });
});

describe('Weekend Engine — Assignment Order (RF-WKND-04)', () => {
  it('assigns presidente first, preventing pool starvation', () => {
    // 3 publishers eligible for presidente; 2 of them also for conductor
    const pub1 = makeCandidate({
      id: 'pub-1',
      rol: Role.ELDER,
      habilitadoConductorAtalaya: true,
    });
    const pub2 = makeCandidate({
      id: 'pub-2',
      rol: Role.ELDER,
      habilitadoConductorAtalaya: true,
    });
    const pub3 = makeCandidate({
      id: 'pub-3',
      rol: Role.ELDER,
      habilitadoConductorAtalaya: false,
    });

    const result = generateWeekendAssignments(
      [pub1, pub2, pub3],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );

    const pres = result.assignments.find((a) => a.slot === 'presidente');
    const cond = result.assignments.find((a) => a.slot === 'conductor');
    expect(pres).toBeDefined();
    expect(cond).toBeDefined();
    // Both should exist — presidente first, then conductor from remaining
  });
});

describe('Weekend Engine — Rotation Selection (RF-WKND-05)', () => {
  it('selects publisher with oldest last-assignment date', () => {
    const pubA = makeCandidate({
      id: 'pub-A',
      nombre: 'Publisher A',
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: true,
    });
    const pubB = makeCandidate({
      id: 'pub-B',
      nombre: 'Publisher B',
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: true,
    });

    const rotationMap = makeRotationMap([
      ['pub-A', 'lector', new Date('2024-01-01')],
      ['pub-B', 'lector', new Date('2024-02-01')],
    ]);

    const result = generateWeekendAssignments(
      [pubA, pubB],
      rotationMap,
      makeExisting(),
      FULL_CONFIG
    );

    const lect = result.assignments.find((a) => a.slot === 'lector');
    expect(lect).toBeDefined();
    expect(lect!.publisherId).toBe('pub-A');
  });

  it('never-assigned publisher wins over recently-assigned', () => {
    const pubNew = makeCandidate({
      id: 'pub-new',
      nombre: 'Never Assigned',
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: true,
    });
    const pubOld = makeCandidate({
      id: 'pub-old',
      nombre: 'Assigned Recently',
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: true,
    });

    const rotationMap = makeRotationMap([
      ['pub-old', 'conductor', new Date('2024-03-01')],
    ]);

    const result = generateWeekendAssignments(
      [pubNew, pubOld],
      rotationMap,
      makeExisting(),
      FULL_CONFIG
    );

    const cond = result.assignments.find((a) => a.slot === 'conductor');
    expect(cond).toBeDefined();
    expect(cond!.publisherId).toBe('pub-new');
  });

  it('same-date tiebreak is deterministic with same seed', () => {
    const pub1 = makeCandidate({
      id: 'pub-1',
      nombre: 'Pub 1',
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: true,
    });
    const pub2 = makeCandidate({
      id: 'pub-2',
      nombre: 'Pub 2',
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: true,
    });

    const sameDate = new Date('2024-01-15');
    const rotationMap = makeRotationMap([
      ['pub-1', 'lector', sameDate],
      ['pub-2', 'lector', sameDate],
    ]);

    const SEED = 12345;
    const config: WeekendEngineConfig = { mode: 'full', seed: SEED };

    const result1 = generateWeekendAssignments(
      [pub1, pub2],
      rotationMap,
      makeExisting(),
      config
    );
    const result2 = generateWeekendAssignments(
      [pub1, pub2],
      rotationMap,
      makeExisting(),
      config
    );

    const lect1 = result1.assignments.find((a) => a.slot === 'lector');
    const lect2 = result2.assignments.find((a) => a.slot === 'lector');
    expect(lect1!.publisherId).toBe(lect2!.publisherId);
  });
});

describe('Weekend Engine — Oracion Apertura Auto-Set (RF-WKND-06)', () => {
  it('oracionInicialId equals presidenteId after full generation', () => {
    const pool = makeFullPool();
    const result = generateWeekendAssignments(
      pool,
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    const pres = result.assignments.find((a) => a.slot === 'presidente');
    expect(pres).toBeDefined();
    expect(result.oracionInicialId).toBe(pres!.publisherId);
  });

  it('oracionInicialId follows existing presidente in partial mode', () => {
    const pool = makeFullPool();
    const existing = makeExisting({ presidenteId: 'elder-1' });

    const result = generateWeekendAssignments(
      pool,
      new Map(),
      existing,
      PARTIAL_CONFIG
    );

    // Presidente was pre-filled, engine should return existing presidenteId
    expect(result.oracionInicialId).toBe('elder-1');
  });

  it('oracionInicialId is null when no presidente assigned or pre-filled', () => {
    // No one eligible for presidente
    const prayer = makeCandidate({
      id: 'prayer',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: false,
      habilitadoOracion: true,
    });
    const result = generateWeekendAssignments(
      [prayer],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );
    expect(result.oracionInicialId).toBeNull();
  });
});

describe('Weekend Engine — Partial Mode (RF-WKND-07)', () => {
  it('skips filled slots and fills empty ones', () => {
    const pool = makeFullPool();
    const existing = makeExisting({
      presidenteId: 'elder-1',
      conductorId: null,
      lectorId: null,
      oracionFinalId: null,
    });

    const result = generateWeekendAssignments(
      pool,
      new Map(),
      existing,
      PARTIAL_CONFIG
    );

    // Presidente skipped
    expect(result.stats.skipped).toBe(1);
    // No assignment for presidente in assignments array
    expect(
      result.assignments.find((a) => a.slot === 'presidente')
    ).toBeUndefined();
    // Other slots should be filled
    expect(result.assignments.length).toBeGreaterThanOrEqual(2);
  });

  it('respects existing assignments in constraints', () => {
    // Presidente already set to elder-1 — elder-1 should NOT be conductor
    const pool = makeFullPool();
    const existing = makeExisting({ presidenteId: 'elder-1' });

    const result = generateWeekendAssignments(
      pool,
      new Map(),
      existing,
      PARTIAL_CONFIG
    );

    const cond = result.assignments.find((a) => a.slot === 'conductor');
    if (cond) {
      expect(cond.publisherId).not.toBe('elder-1');
    }
  });

  it('presidente pre-filled excludes them from oracionFinal too', () => {
    // Only 2 publishers: presidente is pre-filled, other can do oracion
    const elder = makeCandidate({
      id: 'elder-1',
      rol: Role.ELDER,
      habilitadoOracion: true,
    });
    const other = makeCandidate({
      id: 'other',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: false,
      habilitadoOracion: true,
    });

    const existing = makeExisting({ presidenteId: 'elder-1' });

    const result = generateWeekendAssignments(
      [elder, other],
      new Map(),
      existing,
      PARTIAL_CONFIG
    );

    const oracion = result.assignments.find((a) => a.slot === 'oracionFinal');
    if (oracion) {
      // elder-1 is in usedIds, so oracion should go to 'other'
      expect(oracion.publisherId).toBe('other');
    }
  });
});

describe('Weekend Engine — Full Mode (RF-WKND-08)', () => {
  it('replaces all 4 slots', () => {
    const pool = makeFullPool();
    // Existing has all slots filled
    const existing = makeExisting({
      presidenteId: 'elder-1',
      conductorId: 'elder-2',
      lectorId: 'ms-1',
      oracionFinalId: 'bp-1',
    });

    const result = generateWeekendAssignments(
      pool,
      new Map(),
      existing,
      FULL_CONFIG
    );

    // Full mode ignores existing — assigns all 4
    expect(result.stats.skipped).toBe(0);
    expect(result.assignments.length).toBeGreaterThanOrEqual(4);
  });

  it('discurso is untouched (not part of engine output)', () => {
    const pool = makeFullPool();
    const result = generateWeekendAssignments(
      pool,
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );

    // Engine only outputs 4 slot types — no 'discurso' slot
    const slots = result.assignments.map((a) => a.slot);
    expect(slots).not.toContain('discurso');
  });
});

describe('Weekend Engine — No Candidate (RF-WKND-09)', () => {
  it('returns unfilled when no eligible conductor', () => {
    // Only one publisher: eligible for presidente only
    const elder = makeCandidate({
      id: 'elder',
      rol: Role.ELDER,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: false,
      habilitadoOracion: false,
    });

    const result = generateWeekendAssignments(
      [elder],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );

    const conductorUnfilled = result.unfilled.find(
      (u) => u.slot === 'conductor'
    );
    expect(conductorUnfilled).toBeDefined();
    expect(conductorUnfilled!.reason).toContain('No eligible');
  });

  it('returns unfilled when all eligible blocked by constraints', () => {
    // 1 publisher eligible for everything — but can only hold 1 slot
    const solo = makeCandidate({ id: 'solo' });

    const result = generateWeekendAssignments(
      [solo],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );

    // solo gets presidente, then everything else is unfilled
    expect(result.assignments).toHaveLength(1);
    expect(result.unfilled).toHaveLength(3);
  });

  it('continues to next slot after unfilled', () => {
    // Elder eligible only for presidente + oracion
    // No one for conductor/lector
    const elder = makeCandidate({
      id: 'elder',
      rol: Role.ELDER,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: false,
      habilitadoOracion: true,
    });
    const prayerPub = makeCandidate({
      id: 'prayer',
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoPresidenciaFinDeSemana: false,
      habilitadoConductorAtalaya: false,
      habilitadoLectura: false,
      habilitadoOracion: true,
    });

    const result = generateWeekendAssignments(
      [elder, prayerPub],
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );

    // presidente assigned, conductor/lector unfilled, oracion assigned
    expect(
      result.assignments.find((a) => a.slot === 'presidente')
    ).toBeDefined();
    expect(result.unfilled.find((u) => u.slot === 'conductor')).toBeDefined();
    expect(result.unfilled.find((u) => u.slot === 'lector')).toBeDefined();
    expect(
      result.assignments.find((a) => a.slot === 'oracionFinal')
    ).toBeDefined();
  });
});

describe('Weekend Engine — Idempotency (RNF-WKND-04)', () => {
  it('same seed + same input = same output', () => {
    const pool = makeFullPool();
    const rotationMap = makeRotationMap([
      ['elder-1', 'presidente', new Date('2024-01-01')],
      ['elder-2', 'presidente', new Date('2024-01-01')],
      ['ms-1', 'conductor', new Date('2024-02-01')],
    ]);
    const existing = makeExisting();
    const config: WeekendEngineConfig = { mode: 'full', seed: 99999 };

    const result1 = generateWeekendAssignments(
      pool,
      rotationMap,
      existing,
      config
    );
    const result2 = generateWeekendAssignments(
      pool,
      rotationMap,
      existing,
      config
    );

    expect(result1.assignments).toEqual(result2.assignments);
    expect(result1.unfilled).toEqual(result2.unfilled);
    expect(result1.oracionInicialId).toBe(result2.oracionInicialId);
    expect(result1.stats).toEqual(result2.stats);
  });
});

describe('Weekend Engine — Stats', () => {
  it('returns correct stats for full mode', () => {
    const pool = makeFullPool();
    const result = generateWeekendAssignments(
      pool,
      new Map(),
      makeExisting(),
      FULL_CONFIG
    );

    expect(result.stats.totalSlots).toBe(4);
    expect(result.stats.filled + result.stats.unfilled).toBeLessThanOrEqual(4);
    expect(result.stats.skipped).toBe(0);
  });

  it('returns correct stats for partial mode with 2 pre-filled', () => {
    const pool = makeFullPool();
    const existing = makeExisting({
      presidenteId: 'elder-1',
      conductorId: 'elder-2',
    });

    const result = generateWeekendAssignments(
      pool,
      new Map(),
      existing,
      PARTIAL_CONFIG
    );

    expect(result.stats.totalSlots).toBe(4);
    expect(result.stats.skipped).toBe(2);
  });
});
