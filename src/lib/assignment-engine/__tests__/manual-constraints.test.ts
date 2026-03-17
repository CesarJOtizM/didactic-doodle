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
  ManualPublisherCandidate,
  PartSlot,
  SlotAssignment,
  RotationMap,
} from '../types';
import { classifyCandidates } from '../manual-constraints';

// ─── Factories ────────────────────────────────────────────────────────

function makeManualPublisher(
  overrides: Partial<ManualPublisherCandidate> = {}
): ManualPublisherCandidate {
  return {
    id: 'pub-1',
    nombre: 'Test Publisher',
    sexo: Gender.MALE,
    rol: Role.ELDER,
    estado: PublisherStatus.ACTIVE,
    habilitadoVMC: true,
    skipAssignment: false,
    observaciones: null,
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

function emptyRotationMap(): RotationMap {
  return new Map();
}

// ─── Publisher Profiles ───────────────────────────────────────────────

const elderMale = makeManualPublisher({
  id: 'elder-m',
  nombre: 'Elder Male',
  sexo: Gender.MALE,
  rol: Role.ELDER,
});

const ministerialMale = makeManualPublisher({
  id: 'ms-m',
  nombre: 'Ministerial Male',
  sexo: Gender.MALE,
  rol: Role.MINISTERIAL_SERVANT,
});

const baptizedFemale = makeManualPublisher({
  id: 'bp-f',
  nombre: 'Baptized Female',
  sexo: Gender.FEMALE,
  rol: Role.BAPTIZED_PUBLISHER,
});

// ─── Shared Part Fixtures ─────────────────────────────────────────────

const presidentePart = makePart({
  id: 'part-presidente',
  seccion: Section.OPENING,
  tituloKey: 'meetings.parts.presidente',
});

const encargadoPart = makePart({
  id: 'part-encargado',
  seccion: Section.MINISTRY_SCHOOL,
  tituloKey: 'meetings.parts.schoolOverseer',
});

const tesorosPart = makePart({
  id: 'part-tesoros',
  seccion: Section.TREASURES,
  tituloKey: 'meetings.parts.treasuresDiscourse',
});

const lecturaPart = makePart({
  id: 'part-lectura',
  seccion: Section.TREASURES,
  tipo: PartType.READING,
  tituloKey: 'meetings.parts.bibleReading',
});

const smmMainPart = makePart({
  id: 'smm-main',
  seccion: Section.MINISTRY_SCHOOL,
  tipo: PartType.DEMONSTRATION,
  sala: Room.MAIN,
  requiereAyudante: true,
});

const smmAuxPart = makePart({
  id: 'smm-aux',
  seccion: Section.MINISTRY_SCHOOL,
  tipo: PartType.DEMONSTRATION,
  sala: Room.AUXILIARY_1,
  requiereAyudante: true,
});

const closingPrayerPart = makePart({
  id: 'part-closing',
  seccion: Section.CLOSING,
  tipo: PartType.PRAYER,
  tituloKey: 'meetings.parts.closingPrayer',
});

// ─── Tests ────────────────────────────────────────────────────────────

describe('classifyCandidates', () => {
  // ── Hard Constraint: Gender/Role Eligibility (H1) ──

  describe('Hard constraint H1: gender/role eligibility', () => {
    it('blocks a female publisher for Presidente (male Elder only)', () => {
      const result = classifyCandidates(
        [baptizedFemale],
        presidentePart,
        'titular',
        [],
        [presidentePart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('blocked');
      expect(result[0].blockReason).toBe(
        'meetings.override.blocked.ineligible'
      );
    });

    it('blocks a Ministerial Servant for Presidente (Elder only)', () => {
      const result = classifyCandidates(
        [ministerialMale],
        presidentePart,
        'titular',
        [],
        [presidentePart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('blocked');
      expect(result[0].blockReason).toBe(
        'meetings.override.blocked.ineligible'
      );
    });

    it('marks an eligible Elder male as eligible for Presidente', () => {
      const result = classifyCandidates(
        [elderMale],
        presidentePart,
        'titular',
        [],
        [presidentePart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('eligible');
      expect(result[0].warnings).toHaveLength(0);
      expect(result[0].blockReason).toBeUndefined();
    });
  });

  // ── Hard Constraint: Exclusive Roles (H2, H3) ──

  describe('Hard constraint H2: Presidente assigned elsewhere', () => {
    it('blocks publisher already assigned as Presidente for another part', () => {
      const assignments = [
        makeAssignment({
          partId: 'part-presidente',
          publisherId: 'elder-m',
          publisherNombre: 'Elder Male',
        }),
      ];
      const allParts = [presidentePart, tesorosPart];

      const result = classifyCandidates(
        [elderMale],
        tesorosPart,
        'titular',
        assignments,
        allParts,
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('blocked');
      expect(result[0].blockReason).toBe(
        'meetings.override.blocked.exclusiveRole'
      );
    });
  });

  describe('Hard constraint H3: Encargado de escuela assigned elsewhere', () => {
    it('blocks publisher already assigned as Encargado for another part', () => {
      const assignments = [
        makeAssignment({
          partId: 'part-encargado',
          publisherId: 'elder-m',
          publisherNombre: 'Elder Male',
        }),
      ];
      const allParts = [encargadoPart, tesorosPart];

      const result = classifyCandidates(
        [elderMale],
        tesorosPart,
        'titular',
        assignments,
        allParts,
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('blocked');
      expect(result[0].blockReason).toBe(
        'meetings.override.blocked.exclusiveRole'
      );
    });
  });

  // ── Soft Constraint: Duplicate Assignment (S1/S2) ──

  describe('Soft constraint S1/S2: duplicate assignment in same meeting', () => {
    it('warns when publisher already has another assignment in this meeting', () => {
      const assignments = [
        makeAssignment({
          partId: 'part-tesoros',
          publisherId: 'elder-m',
          publisherNombre: 'Elder Male',
        }),
      ];
      const allParts = [tesorosPart, closingPrayerPart];

      const result = classifyCandidates(
        [elderMale],
        closingPrayerPart,
        'titular',
        assignments,
        allParts,
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('warning');
      expect(result[0].warnings).toContainEqual(
        expect.objectContaining({ type: 'duplicate_assignment' })
      );
      // Still selectable — not blocked
      expect(result[0].blockReason).toBeUndefined();
    });
  });

  // ── Soft Constraint: Room Conflict ──

  describe('Soft constraint: room conflict', () => {
    it('warns when publisher assigned in main room for same part type in aux room', () => {
      const assignments = [
        makeAssignment({
          partId: 'smm-main',
          publisherId: 'elder-m',
          publisherNombre: 'Elder Male',
        }),
      ];
      const allParts = [smmMainPart, smmAuxPart];

      const result = classifyCandidates(
        [elderMale],
        smmAuxPart,
        'titular',
        assignments,
        allParts,
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('warning');
      expect(result[0].warnings).toContainEqual(
        expect.objectContaining({ type: 'room_conflict' })
      );
    });
  });

  // ── Soft Constraint: Observaciones (S3) ──

  describe('Soft constraint S3: observaciones present', () => {
    it('warns when publisher has observaciones text', () => {
      const pubWithNotes = makeManualPublisher({
        id: 'pub-notes',
        nombre: 'Publisher Notes',
        observaciones: 'De viaje hasta el 20/04',
      });

      const result = classifyCandidates(
        [pubWithNotes],
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('warning');
      expect(result[0].warnings).toContainEqual(
        expect.objectContaining({
          type: 'has_observaciones',
          message: 'De viaje hasta el 20/04',
        })
      );
    });

    it('does not warn when observaciones is null', () => {
      const pubNoNotes = makeManualPublisher({
        id: 'pub-clean',
        nombre: 'Clean Publisher',
        observaciones: null,
      });

      const result = classifyCandidates(
        [pubNoNotes],
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('eligible');
      expect(
        result[0].warnings.find((w) => w.type === 'has_observaciones')
      ).toBeUndefined();
    });
  });

  // ── Soft Constraint: skipAssignment (S4) ──

  describe('Soft constraint S4: skipAssignment=true', () => {
    it('warns when publisher has skipAssignment=true', () => {
      const pubSkip = makeManualPublisher({
        id: 'pub-skip',
        nombre: 'Skip Publisher',
        skipAssignment: true,
      });

      const result = classifyCandidates(
        [pubSkip],
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('warning');
      expect(result[0].warnings).toContainEqual(
        expect.objectContaining({ type: 'skip_assignment' })
      );
    });
  });

  // ── Eligible Publisher ──

  describe('Eligible publisher with no issues', () => {
    it('marks publisher as eligible with empty warnings', () => {
      const result = classifyCandidates(
        [elderMale],
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'elder-m',
        nombre: 'Elder Male',
        status: 'eligible',
        warnings: [],
      });
      expect(result[0].blockReason).toBeUndefined();
    });
  });

  // ── Multiple Soft Warnings Accumulate ──

  describe('Multiple warnings accumulate', () => {
    it('shows all applicable soft warnings on a single candidate', () => {
      const pubMultiWarn = makeManualPublisher({
        id: 'pub-multi',
        nombre: 'Multi Warn',
        skipAssignment: true,
        observaciones: 'Tiene problemas de horario',
      });

      // Already assigned in this meeting
      const assignments = [
        makeAssignment({
          partId: 'part-tesoros',
          publisherId: 'pub-multi',
          publisherNombre: 'Multi Warn',
        }),
      ];
      const allParts = [tesorosPart, closingPrayerPart];

      const result = classifyCandidates(
        [pubMultiWarn],
        closingPrayerPart,
        'titular',
        assignments,
        allParts,
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('warning');
      expect(result[0].warnings).toHaveLength(3);

      const warningTypes = result[0].warnings.map((w) => w.type);
      expect(warningTypes).toContain('duplicate_assignment');
      expect(warningTypes).toContain('has_observaciones');
      expect(warningTypes).toContain('skip_assignment');
    });
  });

  // ── Blocked candidates get NO soft warnings ──

  describe('Blocked candidates skip soft warning checks', () => {
    it('does not compute soft warnings for blocked publishers', () => {
      // Female with skipAssignment + observaciones for Presidente
      const blockedPub = makeManualPublisher({
        id: 'pub-blocked',
        nombre: 'Blocked Female',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
        skipAssignment: true,
        observaciones: 'Some notes',
      });

      const result = classifyCandidates(
        [blockedPub],
        presidentePart,
        'titular',
        [],
        [presidentePart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('blocked');
      expect(result[0].blockReason).toBe(
        'meetings.override.blocked.ineligible'
      );
      // Soft warnings NOT computed for blocked candidates
      expect(result[0].warnings).toHaveLength(0);
    });
  });

  // ── Sorting ──

  describe('Sorting: eligible → warned → blocked', () => {
    it('sorts candidates by status group, then by oldest assignment', () => {
      const pubEligible = makeManualPublisher({
        id: 'pub-eligible',
        nombre: 'Eligible',
      });
      const pubWarned = makeManualPublisher({
        id: 'pub-warned',
        nombre: 'Warned',
        skipAssignment: true,
      });
      const pubBlocked = makeManualPublisher({
        id: 'pub-blocked',
        nombre: 'Blocked',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      });

      // Presidente part: female is blocked, skipAssignment gets warned
      const result = classifyCandidates(
        [pubBlocked, pubWarned, pubEligible], // intentionally out of order
        presidentePart,
        'titular',
        [],
        [presidentePart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('eligible');
      expect(result[0].id).toBe('pub-eligible');
      expect(result[1].status).toBe('warning');
      expect(result[1].id).toBe('pub-warned');
      expect(result[2].status).toBe('blocked');
      expect(result[2].id).toBe('pub-blocked');
    });

    it('sorts eligible candidates by oldest last assignment date first', () => {
      const pubOld = makeManualPublisher({
        id: 'pub-old',
        nombre: 'Old Assignment',
      });
      const pubRecent = makeManualPublisher({
        id: 'pub-recent',
        nombre: 'Recent Assignment',
      });
      const pubNever = makeManualPublisher({
        id: 'pub-never',
        nombre: 'Never Assigned',
      });

      const rotationMap: RotationMap = new Map([
        [
          'pub-old',
          new Map([
            ['meetings.parts.treasuresDiscourse', new Date('2025-01-01')],
          ]),
        ],
        [
          'pub-recent',
          new Map([
            ['meetings.parts.treasuresDiscourse', new Date('2026-03-01')],
          ]),
        ],
        // pub-never has no entries
      ]);

      const result = classifyCandidates(
        [pubRecent, pubOld, pubNever], // intentionally out of order
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        rotationMap
      );

      expect(result).toHaveLength(3);
      // Never assigned (null → 0) comes first
      expect(result[0].id).toBe('pub-never');
      expect(result[0].lastAssignmentDate).toBeNull();
      // Then oldest date
      expect(result[1].id).toBe('pub-old');
      // Then most recent
      expect(result[2].id).toBe('pub-recent');
    });
  });

  // ── Helper-Specific Filtering ──

  describe('Helper filtering: titular excluded', () => {
    it('excludes the current titular from helper candidate list', () => {
      const titular = makeManualPublisher({
        id: 'pub-titular',
        nombre: 'Titular',
      });
      const helper1 = makeManualPublisher({
        id: 'pub-helper-1',
        nombre: 'Helper 1',
      });
      const helper2 = makeManualPublisher({
        id: 'pub-helper-2',
        nombre: 'Helper 2',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      });

      const assignments = [
        makeAssignment({
          partId: 'smm-main',
          publisherId: 'pub-titular',
          publisherNombre: 'Titular',
        }),
      ];

      const result = classifyCandidates(
        [titular, helper1, helper2],
        smmMainPart,
        'helper',
        assignments,
        [smmMainPart],
        emptyRotationMap(),
        'pub-titular' // currentTitularId
      );

      // Titular should be excluded entirely (not even present as blocked)
      expect(result.find((c) => c.id === 'pub-titular')).toBeUndefined();
      expect(result).toHaveLength(2);
    });

    it('does not exclude titular when role is titular', () => {
      const pub = makeManualPublisher({
        id: 'pub-A',
        nombre: 'Publisher A',
      });

      const result = classifyCandidates(
        [pub],
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        emptyRotationMap(),
        'pub-A' // currentTitularId passed but role is 'titular', should be ignored
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pub-A');
    });
  });

  // ── Last Assignment Date Population ──

  describe('Last assignment date from rotation map', () => {
    it('populates lastAssignmentDate from rotation map', () => {
      const pub = makeManualPublisher({
        id: 'pub-dated',
        nombre: 'Dated Publisher',
      });

      const rotationMap: RotationMap = new Map([
        [
          'pub-dated',
          new Map([
            [
              'meetings.parts.treasuresDiscourse',
              new Date('2026-02-15T00:00:00Z'),
            ],
          ]),
        ],
      ]);

      const result = classifyCandidates(
        [pub],
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        rotationMap
      );

      expect(result).toHaveLength(1);
      expect(result[0].lastAssignmentDate).toEqual(
        new Date('2026-02-15T00:00:00Z')
      );
    });

    it('returns null when publisher has no rotation history for this key', () => {
      const pub = makeManualPublisher({
        id: 'pub-new',
        nombre: 'New Publisher',
      });

      const result = classifyCandidates(
        [pub],
        tesorosPart,
        'titular',
        [],
        [tesorosPart],
        emptyRotationMap()
      );

      expect(result).toHaveLength(1);
      expect(result[0].lastAssignmentDate).toBeNull();
    });
  });

  // ── Mixed Scenario: Real-World Pool ──

  describe('Mixed pool classification', () => {
    it('correctly classifies a diverse pool of candidates', () => {
      // Setup: Presidente slot with various publishers
      const pubPresidente = makeManualPublisher({
        id: 'pub-pres',
        nombre: 'Current Presidente',
      });
      const pubEligible = makeManualPublisher({
        id: 'pub-elig',
        nombre: 'Clean Elder',
      });
      const pubSkip = makeManualPublisher({
        id: 'pub-skip',
        nombre: 'Skip Elder',
        skipAssignment: true,
      });
      const pubFemale = makeManualPublisher({
        id: 'pub-fem',
        nombre: 'Female Publisher',
        sexo: Gender.FEMALE,
        rol: Role.BAPTIZED_PUBLISHER,
      });
      const pubMinisterial = makeManualPublisher({
        id: 'pub-ms',
        nombre: 'Ministerial Servant',
        rol: Role.MINISTERIAL_SERVANT,
      });

      // pubPresidente is assigned as Presidente (exclusive role)
      const assignments = [
        makeAssignment({
          partId: 'part-presidente',
          publisherId: 'pub-pres',
          publisherNombre: 'Current Presidente',
        }),
      ];

      const allParts = [presidentePart, lecturaPart];

      // Trying to assign Lectura (any male)
      const result = classifyCandidates(
        [pubPresidente, pubEligible, pubSkip, pubFemale, pubMinisterial],
        lecturaPart,
        'titular',
        assignments,
        allParts,
        emptyRotationMap()
      );

      expect(result).toHaveLength(5);

      // pubPresidente: blocked (exclusive role — assigned as Presidente)
      const pres = result.find((c) => c.id === 'pub-pres')!;
      expect(pres.status).toBe('blocked');
      expect(pres.blockReason).toBe('meetings.override.blocked.exclusiveRole');

      // pubEligible: eligible (no issues)
      const elig = result.find((c) => c.id === 'pub-elig')!;
      expect(elig.status).toBe('eligible');

      // pubSkip: warned (skipAssignment)
      const skip = result.find((c) => c.id === 'pub-skip')!;
      expect(skip.status).toBe('warning');
      expect(skip.warnings).toContainEqual(
        expect.objectContaining({ type: 'skip_assignment' })
      );

      // pubFemale: blocked (lectura = any male, female not eligible)
      const fem = result.find((c) => c.id === 'pub-fem')!;
      expect(fem.status).toBe('blocked');
      expect(fem.blockReason).toBe('meetings.override.blocked.ineligible');

      // pubMinisterial: eligible (lectura = any male, MS qualifies)
      const ms = result.find((c) => c.id === 'pub-ms')!;
      expect(ms.status).toBe('eligible');

      // Check sorting order: eligible first, then warned, then blocked
      const statuses = result.map((c) => c.status);
      const eligibleIdx = statuses.lastIndexOf('eligible');
      const warningIdx = statuses.indexOf('warning');
      const blockedIdx = statuses.indexOf('blocked');

      if (warningIdx !== -1) {
        expect(eligibleIdx).toBeLessThan(warningIdx);
      }
      if (blockedIdx !== -1 && warningIdx !== -1) {
        expect(warningIdx).toBeLessThan(blockedIdx);
      }
    });
  });
});
