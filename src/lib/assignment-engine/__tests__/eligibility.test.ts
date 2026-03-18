import { describe, it, expect } from 'vitest';
import {
  Gender,
  Role,
  PublisherStatus,
  Section,
  PartType,
  Room,
} from '@/generated/prisma/enums';
import type { PublisherCandidate, PartSlot } from '../types';
import {
  getEligibilityKey,
  getHelperEligibilityKey,
  isEligible,
  getEligibleCandidates,
  getEligibleHelpers,
} from '../eligibility';

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
    habilitadoOracion: true,
    habilitadoLectura: true,
    skipAssignment: false,
    ...overrides,
  };
}

function makeFixedPart(
  tituloKey: string,
  overrides: Partial<PartSlot> = {}
): PartSlot {
  return {
    id: 'part-1',
    seccion: Section.OPENING,
    tipo: PartType.SPEECH,
    titulo: null,
    orden: 1,
    sala: Room.MAIN,
    requiereAyudante: false,
    tituloKey,
    ...overrides,
  };
}

function makeDynamicPart(
  seccion: Section,
  tipo: PartType,
  overrides: Partial<PartSlot> = {}
): PartSlot {
  return {
    id: 'part-dyn-1',
    seccion,
    tipo,
    titulo: 'Dynamic Part',
    orden: 10,
    sala: Room.MAIN,
    requiereAyudante: false,
    // No tituloKey — this is a dynamic part
    ...overrides,
  };
}

// ─── Profiles for matrix testing ──────────────────────────────────────

const elderMale = makePublisher({
  id: 'elder-m',
  rol: Role.ELDER,
  sexo: Gender.MALE,
});
const ministerialMale = makePublisher({
  id: 'ms-m',
  rol: Role.MINISTERIAL_SERVANT,
  sexo: Gender.MALE,
});
const baptizedMale = makePublisher({
  id: 'bp-m',
  rol: Role.BAPTIZED_PUBLISHER,
  sexo: Gender.MALE,
});
const unbaptizedMale = makePublisher({
  id: 'ub-m',
  rol: Role.UNBAPTIZED_PUBLISHER,
  sexo: Gender.MALE,
});
const elderFemale = makePublisher({
  id: 'elder-f',
  rol: Role.ELDER,
  sexo: Gender.FEMALE,
});
const baptizedFemale = makePublisher({
  id: 'bp-f',
  rol: Role.BAPTIZED_PUBLISHER,
  sexo: Gender.FEMALE,
});
const unbaptizedFemale = makePublisher({
  id: 'ub-f',
  rol: Role.UNBAPTIZED_PUBLISHER,
  sexo: Gender.FEMALE,
});

// ─── Tests ────────────────────────────────────────────────────────────

describe('getEligibilityKey', () => {
  it('returns tituloKey for fixed parts', () => {
    const part = makeFixedPart('meetings.parts.presidente');
    expect(getEligibilityKey(part)).toBe('meetings.parts.presidente');
  });

  it('returns MINISTRY_SCHOOL:DEMONSTRATION:titular for dynamic SMM demos', () => {
    const part = makeDynamicPart(
      Section.MINISTRY_SCHOOL,
      PartType.DEMONSTRATION
    );
    expect(getEligibilityKey(part)).toBe(
      'MINISTRY_SCHOOL:DEMONSTRATION:titular'
    );
  });

  it('returns MINISTRY_SCHOOL:SPEECH:titular for dynamic SMM speeches', () => {
    const part = makeDynamicPart(Section.MINISTRY_SCHOOL, PartType.SPEECH);
    expect(getEligibilityKey(part)).toBe('MINISTRY_SCHOOL:SPEECH:titular');
  });

  it('returns CHRISTIAN_LIFE:dynamic for dynamic NVC parts', () => {
    const part = makeDynamicPart(Section.CHRISTIAN_LIFE, PartType.SPEECH);
    expect(getEligibilityKey(part)).toBe('CHRISTIAN_LIFE:dynamic');
  });

  it('returns fallback key for unknown section without tituloKey', () => {
    const part = makeDynamicPart(Section.CLOSING, PartType.SONG);
    expect(getEligibilityKey(part)).toContain('unknown');
  });
});

describe('getHelperEligibilityKey', () => {
  it('always returns MINISTRY_SCHOOL:helper', () => {
    const part = makeDynamicPart(
      Section.MINISTRY_SCHOOL,
      PartType.DEMONSTRATION
    );
    expect(getHelperEligibilityKey(part)).toBe('MINISTRY_SCHOOL:helper');
  });
});

describe('Prerequisite filters (REQ-ELIG-01)', () => {
  const presidentePart = makeFixedPart('meetings.parts.presidente');

  it('excludes publisher with habilitadoVMC=false', () => {
    const pub = makePublisher({ habilitadoVMC: false });
    const result = getEligibleCandidates([pub], presidentePart);
    expect(result).toHaveLength(0);
  });

  it('excludes publisher with estado=ABSENT', () => {
    const pub = makePublisher({ estado: PublisherStatus.ABSENT });
    const result = getEligibleCandidates([pub], presidentePart);
    expect(result).toHaveLength(0);
  });

  it('excludes publisher with estado=RESTRICTED', () => {
    const pub = makePublisher({ estado: PublisherStatus.RESTRICTED });
    const result = getEligibleCandidates([pub], presidentePart);
    expect(result).toHaveLength(0);
  });

  it('excludes publisher with estado=INACTIVE', () => {
    const pub = makePublisher({ estado: PublisherStatus.INACTIVE });
    const result = getEligibleCandidates([pub], presidentePart);
    expect(result).toHaveLength(0);
  });

  it('excludes publisher with skipAssignment=true', () => {
    const pub = makePublisher({ skipAssignment: true });
    const result = getEligibleCandidates([pub], presidentePart);
    expect(result).toHaveLength(0);
  });

  it('includes publisher passing all prerequisites', () => {
    const pub = makePublisher(); // Elder male, all defaults pass
    const result = getEligibleCandidates([pub], presidentePart);
    expect(result).toHaveLength(1);
  });
});

describe('Eligibility matrix (REQ-ELIG-02)', () => {
  describe('Presidente — Elder only', () => {
    const part = makeFixedPart('meetings.parts.presidente');

    it('Elder male → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Ministerial male → NOT eligible', () => {
      expect(getEligibleCandidates([ministerialMale], part)).toHaveLength(0);
    });
    it('Baptized male → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(0);
    });
    it('Unbaptized male → NOT eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(0);
    });
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(0);
    });
  });

  describe('Oración inicial — habilitadoOracion boolean', () => {
    const part = makeFixedPart('meetings.parts.openingPrayer', {
      seccion: Section.OPENING,
      tipo: PartType.PRAYER,
    });

    it('Publisher with habilitadoOracion=true → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Any role with habilitadoOracion=true → eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(1);
    });
    it('Female with habilitadoOracion=true → eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(1);
    });
    it('Publisher with habilitadoOracion=false → NOT eligible', () => {
      const pub = makePublisher({ habilitadoOracion: false });
      expect(getEligibleCandidates([pub], part)).toHaveLength(0);
    });
    it('Elder with habilitadoOracion=false → NOT eligible', () => {
      const pub = makePublisher({
        rol: Role.ELDER,
        sexo: Gender.MALE,
        habilitadoOracion: false,
      });
      expect(getEligibleCandidates([pub], part)).toHaveLength(0);
    });
  });

  describe('Tesoros discurso — Elder or Ministerial', () => {
    const part = makeFixedPart('meetings.parts.treasuresDiscourse', {
      seccion: Section.TREASURES,
      tipo: PartType.SPEECH,
    });

    it('Elder → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Ministerial → eligible', () => {
      expect(getEligibleCandidates([ministerialMale], part)).toHaveLength(1);
    });
    it('Baptized male → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(0);
    });
  });

  describe('Perlas — Elder or Ministerial', () => {
    const part = makeFixedPart('meetings.parts.pearls', {
      seccion: Section.TREASURES,
      tipo: PartType.DISCUSSION,
    });

    it('Elder → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Ministerial → eligible', () => {
      expect(getEligibleCandidates([ministerialMale], part)).toHaveLength(1);
    });
    it('Baptized male → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(0);
    });
  });

  describe('Lectura (Bible reading) — Any male', () => {
    const part = makeFixedPart('meetings.parts.bibleReading', {
      seccion: Section.TREASURES,
      tipo: PartType.READING,
    });

    it('Elder male → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Ministerial male → eligible', () => {
      expect(getEligibleCandidates([ministerialMale], part)).toHaveLength(1);
    });
    it('Baptized male → eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(1);
    });
    it('Unbaptized male → eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(1);
    });
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(0);
    });
  });

  describe('Lectura auxiliar — Any male', () => {
    const part = makeFixedPart('meetings.parts.bibleReadingAux', {
      seccion: Section.TREASURES,
      tipo: PartType.READING,
      sala: Room.AUXILIARY_1,
    });

    it('Any male → eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(1);
    });
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(0);
    });
  });

  describe('Encargado de escuela — Elder only', () => {
    const part = makeFixedPart('meetings.parts.schoolOverseer', {
      seccion: Section.MINISTRY_SCHOOL,
      tipo: PartType.SPEECH,
    });

    it('Elder → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Ministerial → NOT eligible', () => {
      expect(getEligibleCandidates([ministerialMale], part)).toHaveLength(0);
    });
    it('Baptized male → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(0);
    });
  });

  describe('Estudio Conductor — Elder or Ministerial', () => {
    const part = makeFixedPart('meetings.parts.studyConductor', {
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.STUDY,
    });

    it('Elder → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Ministerial → eligible', () => {
      expect(getEligibleCandidates([ministerialMale], part)).toHaveLength(1);
    });
    it('Baptized male → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(0);
    });
  });

  describe('Estudio Lector — habilitadoLectura boolean', () => {
    const part = makeFixedPart('meetings.parts.studyReader', {
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.READING,
    });

    it('Publisher with habilitadoLectura=true → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Publisher with habilitadoLectura=true (any role) → eligible', () => {
      const pub = makePublisher({
        id: 'bp-m-reader',
        rol: Role.BAPTIZED_PUBLISHER,
        sexo: Gender.MALE,
        habilitadoLectura: true,
      });
      expect(getEligibleCandidates([pub], part)).toHaveLength(1);
    });
    it('Publisher with habilitadoLectura=false → NOT eligible', () => {
      const pub = makePublisher({
        id: 'elder-no-read',
        rol: Role.ELDER,
        sexo: Gender.MALE,
        habilitadoLectura: false,
      });
      expect(getEligibleCandidates([pub], part)).toHaveLength(0);
    });
    it('Elder with habilitadoLectura=false → NOT eligible', () => {
      const pub = makePublisher({
        rol: Role.ELDER,
        sexo: Gender.MALE,
        habilitadoLectura: false,
      });
      expect(getEligibleCandidates([pub], part)).toHaveLength(0);
    });
  });

  describe('Oración conclusión — habilitadoOracion boolean', () => {
    const part = makeFixedPart('meetings.parts.closingPrayer', {
      seccion: Section.CLOSING,
      tipo: PartType.PRAYER,
    });

    it('Publisher with habilitadoOracion=true → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Baptized male with habilitadoOracion=true → eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(1);
    });
    it('Unbaptized male with habilitadoOracion=true → eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(1);
    });
    it('Female with habilitadoOracion=true → eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(1);
    });
    it('Publisher with habilitadoOracion=false → NOT eligible', () => {
      const pub = makePublisher({
        rol: Role.ELDER,
        sexo: Gender.MALE,
        habilitadoOracion: false,
      });
      expect(getEligibleCandidates([pub], part)).toHaveLength(0);
    });
  });

  describe('SMM demostración titular — anyone enabled', () => {
    const part = makeDynamicPart(
      Section.MINISTRY_SCHOOL,
      PartType.DEMONSTRATION,
      {
        requiereAyudante: true,
      }
    );

    it('Elder male → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Female → eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(1);
    });
    it('Unbaptized female → eligible', () => {
      expect(getEligibleCandidates([unbaptizedFemale], part)).toHaveLength(1);
    });
    it('Unbaptized male → eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(1);
    });
  });

  describe('SMM discurso titular — any male', () => {
    const part = makeDynamicPart(Section.MINISTRY_SCHOOL, PartType.SPEECH);

    it('Elder male → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Unbaptized male → eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(1);
    });
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(0);
    });
  });

  describe('SMM ayudante — anyone enabled', () => {
    const part = makeDynamicPart(
      Section.MINISTRY_SCHOOL,
      PartType.DEMONSTRATION,
      {
        requiereAyudante: true,
      }
    );

    it('Elder male → eligible as helper', () => {
      expect(getEligibleHelpers([elderMale], part)).toHaveLength(1);
    });
    it('Female → eligible as helper', () => {
      expect(getEligibleHelpers([baptizedFemale], part)).toHaveLength(1);
    });
    it('Unbaptized female → eligible as helper', () => {
      expect(getEligibleHelpers([unbaptizedFemale], part)).toHaveLength(1);
    });
  });

  describe('NVC dynamic parts — Elder or Ministerial', () => {
    const part = makeDynamicPart(Section.CHRISTIAN_LIFE, PartType.SPEECH);

    it('Elder → eligible', () => {
      expect(getEligibleCandidates([elderMale], part)).toHaveLength(1);
    });
    it('Ministerial → eligible', () => {
      expect(getEligibleCandidates([ministerialMale], part)).toHaveLength(1);
    });
    it('Baptized male → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedMale], part)).toHaveLength(0);
    });
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([elderFemale], part)).toHaveLength(0);
    });
  });
});

describe('isEligible (direct)', () => {
  it('returns false for unknown eligibility key', () => {
    expect(isEligible(elderMale, 'unknown:key:nonsense')).toBe(false);
  });

  it('returns true for matching key + publisher', () => {
    expect(isEligible(elderMale, 'meetings.parts.presidente')).toBe(true);
  });

  it('returns false for non-matching publisher', () => {
    expect(isEligible(ministerialMale, 'meetings.parts.presidente')).toBe(
      false
    );
  });
});

describe('getEligibleCandidates — mixed pool filtering', () => {
  it('filters a mixed pool correctly for Presidente', () => {
    const allPublishers = [
      elderMale,
      ministerialMale,
      baptizedMale,
      unbaptizedMale,
      baptizedFemale,
    ];
    const part = makeFixedPart('meetings.parts.presidente');
    const result = getEligibleCandidates(allPublishers, part);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('elder-m');
  });

  it('filters a mixed pool correctly for Lectura', () => {
    const allPublishers = [
      elderMale,
      ministerialMale,
      baptizedMale,
      unbaptizedMale,
      baptizedFemale,
    ];
    const part = makeFixedPart('meetings.parts.bibleReading', {
      seccion: Section.TREASURES,
      tipo: PartType.READING,
    });
    const result = getEligibleCandidates(allPublishers, part);
    // All males pass
    expect(result).toHaveLength(4);
    expect(result.every((p) => p.sexo === Gender.MALE)).toBe(true);
  });

  it('filters a mixed pool correctly for SMM demostración', () => {
    const allPublishers = [
      elderMale,
      ministerialMale,
      baptizedMale,
      unbaptizedMale,
      baptizedFemale,
      unbaptizedFemale,
    ];
    const part = makeDynamicPart(
      Section.MINISTRY_SCHOOL,
      PartType.DEMONSTRATION
    );
    const result = getEligibleCandidates(allPublishers, part);
    // Everyone passes
    expect(result).toHaveLength(6);
  });
});

describe('getEligibleHelpers — same-gender filter for demonstrations', () => {
  const demoPart = makeDynamicPart(
    Section.MINISTRY_SCHOOL,
    PartType.DEMONSTRATION,
    { requiereAyudante: true }
  );

  const allPublishers = [
    elderMale,
    ministerialMale,
    baptizedMale,
    unbaptizedMale,
    baptizedFemale,
    unbaptizedFemale,
  ];

  it('without titularGender, returns all eligible helpers (manual assignment)', () => {
    const result = getEligibleHelpers(allPublishers, demoPart);
    expect(result).toHaveLength(6);
  });

  it('with male titular, returns only male helpers', () => {
    const result = getEligibleHelpers(allPublishers, demoPart, Gender.MALE);
    expect(result).toHaveLength(4);
    expect(result.every((p) => p.sexo === Gender.MALE)).toBe(true);
  });

  it('with female titular, returns only female helpers', () => {
    const result = getEligibleHelpers(allPublishers, demoPart, Gender.FEMALE);
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.sexo === Gender.FEMALE)).toBe(true);
  });

  it('does NOT apply gender filter for non-demonstration parts', () => {
    const speechPart = makeDynamicPart(
      Section.MINISTRY_SCHOOL,
      PartType.SPEECH,
      { requiereAyudante: true }
    );
    const result = getEligibleHelpers(allPublishers, speechPart, Gender.MALE);
    // Speech parts have no same-gender constraint, all eligible
    expect(result).toHaveLength(6);
  });
});

describe('habilitadoOracion — prayer eligibility', () => {
  it('publisher with habilitadoOracion=true can pray regardless of role', () => {
    const unbaptizedFemaleCanPray = makePublisher({
      id: 'ub-f-pray',
      sexo: Gender.FEMALE,
      rol: Role.UNBAPTIZED_PUBLISHER,
      habilitadoOracion: true,
    });
    const openingPrayer = makeFixedPart('meetings.parts.openingPrayer', {
      seccion: Section.OPENING,
      tipo: PartType.PRAYER,
    });
    expect(getEligibleCandidates([unbaptizedFemaleCanPray], openingPrayer)).toHaveLength(1);
  });

  it('publisher with habilitadoOracion=false cannot pray even if elder', () => {
    const elderNoPray = makePublisher({
      id: 'elder-no-pray',
      sexo: Gender.MALE,
      rol: Role.ELDER,
      habilitadoOracion: false,
    });
    const closingPrayer = makeFixedPart('meetings.parts.closingPrayer', {
      seccion: Section.CLOSING,
      tipo: PartType.PRAYER,
    });
    expect(getEligibleCandidates([elderNoPray], closingPrayer)).toHaveLength(0);
  });

  it('filters mixed pool correctly for prayers based on habilitadoOracion', () => {
    const canPray1 = makePublisher({
      id: 'can-pray-1',
      habilitadoOracion: true,
    });
    const canPray2 = makePublisher({
      id: 'can-pray-2',
      sexo: Gender.FEMALE,
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoOracion: true,
    });
    const cantPray = makePublisher({
      id: 'cant-pray',
      habilitadoOracion: false,
    });
    const openingPrayer = makeFixedPart('meetings.parts.openingPrayer', {
      seccion: Section.OPENING,
      tipo: PartType.PRAYER,
    });
    const result = getEligibleCandidates([canPray1, canPray2, cantPray], openingPrayer);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(['can-pray-1', 'can-pray-2']);
  });
});

describe('habilitadoLectura — reader eligibility', () => {
  it('publisher with habilitadoLectura=true can be reader regardless of role', () => {
    const unbaptizedMaleCanRead = makePublisher({
      id: 'ub-m-read',
      sexo: Gender.MALE,
      rol: Role.UNBAPTIZED_PUBLISHER,
      habilitadoLectura: true,
    });
    const studyReader = makeFixedPart('meetings.parts.studyReader', {
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.READING,
    });
    expect(getEligibleCandidates([unbaptizedMaleCanRead], studyReader)).toHaveLength(1);
  });

  it('publisher with habilitadoLectura=false cannot be reader even if elder', () => {
    const elderNoRead = makePublisher({
      id: 'elder-no-read',
      sexo: Gender.MALE,
      rol: Role.ELDER,
      habilitadoLectura: false,
    });
    const studyReader = makeFixedPart('meetings.parts.studyReader', {
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.READING,
    });
    expect(getEligibleCandidates([elderNoRead], studyReader)).toHaveLength(0);
  });

  it('filters mixed pool correctly for study reader based on habilitadoLectura', () => {
    const canRead1 = makePublisher({
      id: 'can-read-1',
      habilitadoLectura: true,
    });
    const canRead2 = makePublisher({
      id: 'can-read-2',
      sexo: Gender.MALE,
      rol: Role.BAPTIZED_PUBLISHER,
      habilitadoLectura: true,
    });
    const cantRead = makePublisher({
      id: 'cant-read',
      habilitadoLectura: false,
    });
    const studyReader = makeFixedPart('meetings.parts.studyReader', {
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.READING,
    });
    const result = getEligibleCandidates([canRead1, canRead2, cantRead], studyReader);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(['can-read-1', 'can-read-2']);
  });
});
