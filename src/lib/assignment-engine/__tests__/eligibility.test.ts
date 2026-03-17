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

  describe('Oración inicial — Elder or Ministerial', () => {
    const part = makeFixedPart('meetings.parts.openingPrayer', {
      seccion: Section.OPENING,
      tipo: PartType.PRAYER,
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
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(0);
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

  describe('Estudio Lector — Elder, Ministerial, or Baptized male', () => {
    const part = makeFixedPart('meetings.parts.studyReader', {
      seccion: Section.CHRISTIAN_LIFE,
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
    it('Unbaptized male → NOT eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(0);
    });
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(0);
    });
  });

  describe('Oración conclusión — Elder, Ministerial, or Baptized male', () => {
    const part = makeFixedPart('meetings.parts.closingPrayer', {
      seccion: Section.CLOSING,
      tipo: PartType.PRAYER,
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
    it('Unbaptized male → NOT eligible', () => {
      expect(getEligibleCandidates([unbaptizedMale], part)).toHaveLength(0);
    });
    it('Female → NOT eligible', () => {
      expect(getEligibleCandidates([baptizedFemale], part)).toHaveLength(0);
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
