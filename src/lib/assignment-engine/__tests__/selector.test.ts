import { describe, it, expect } from 'vitest';
import { Gender, Role, PublisherStatus } from '@/generated/prisma/enums';
import type { PublisherCandidate, RotationMap } from '../types';
import { selectPublisher } from '../selector';

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

// ─── Tests ────────────────────────────────────────────────────────────

const KEY = 'meetings.parts.treasuresDiscourse';

describe('selectPublisher', () => {
  it('returns null for empty candidates list', () => {
    const result = selectPublisher([], KEY, new Map());
    expect(result).toBeNull();
  });

  it('returns the only candidate when list has one element', () => {
    const pub = makePublisher({ id: 'solo' });
    const result = selectPublisher([pub], KEY, new Map());
    expect(result).not.toBeNull();
    expect(result!.id).toBe('solo');
  });

  it('selects the publisher with the older last-assignment date', () => {
    const pubA = makePublisher({ id: 'pub-A', nombre: 'Publisher A' });
    const pubB = makePublisher({ id: 'pub-B', nombre: 'Publisher B' });

    const rotationMap = makeRotationMap([
      ['pub-A', KEY, new Date('2024-01-01')],
      ['pub-B', KEY, new Date('2024-02-01')],
    ]);

    const result = selectPublisher([pubA, pubB], KEY, rotationMap, 42);
    expect(result!.id).toBe('pub-A');
  });

  it('selects never-assigned publisher over recently-assigned', () => {
    const pubNew = makePublisher({ id: 'pub-new', nombre: 'Never Assigned' });
    const pubOld = makePublisher({
      id: 'pub-old',
      nombre: 'Assigned 2 weeks ago',
    });

    const rotationMap = makeRotationMap([
      ['pub-old', KEY, new Date('2024-03-01')],
      // pub-new has no entry — treated as epoch 0
    ]);

    const result = selectPublisher([pubNew, pubOld], KEY, rotationMap, 42);
    expect(result!.id).toBe('pub-new');
  });

  it('uses seeded random for deterministic tiebreak with same dates', () => {
    const pubA = makePublisher({ id: 'pub-A', nombre: 'Publisher A' });
    const pubB = makePublisher({ id: 'pub-B', nombre: 'Publisher B' });
    const pubC = makePublisher({ id: 'pub-C', nombre: 'Publisher C' });

    const sameDate = new Date('2024-01-15');
    const rotationMap = makeRotationMap([
      ['pub-A', KEY, sameDate],
      ['pub-B', KEY, sameDate],
      ['pub-C', KEY, sameDate],
    ]);

    const SEED = 12345;

    // Same seed should produce same result every time
    const result1 = selectPublisher([pubA, pubB, pubC], KEY, rotationMap, SEED);
    const result2 = selectPublisher([pubA, pubB, pubC], KEY, rotationMap, SEED);
    expect(result1!.id).toBe(result2!.id);
  });

  it('produces deterministic results with same seed across calls', () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makePublisher({ id: `pub-${i}`, nombre: `Publisher ${i}` })
    );

    // All never-assigned — all tied at epoch 0
    const rotationMap: RotationMap = new Map();
    const SEED = 99999;

    const results = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const result = selectPublisher(candidates, KEY, rotationMap, SEED);
      results.add(result!.id);
    }

    // Same seed, same input → always same output
    expect(results.size).toBe(1);
  });

  it('handles rotation map with data for different eligibility key', () => {
    const pubA = makePublisher({ id: 'pub-A' });
    const pubB = makePublisher({ id: 'pub-B' });

    // Both have data, but for a DIFFERENT key — so both are treated as epoch 0
    const rotationMap = makeRotationMap([
      ['pub-A', 'meetings.parts.presidente', new Date('2024-01-01')],
      ['pub-B', 'meetings.parts.presidente', new Date('2024-06-01')],
    ]);

    const result = selectPublisher([pubA, pubB], KEY, rotationMap, 42);
    // Both are tied at epoch 0 for KEY — one is picked by seeded random
    expect(result).not.toBeNull();
  });

  it('considers only the matching eligibility key for rotation', () => {
    const pubA = makePublisher({ id: 'pub-A' });
    const pubB = makePublisher({ id: 'pub-B' });

    const rotationMap = makeRotationMap([
      // pubA was assigned presidente recently, but for KEY has old date
      ['pub-A', 'meetings.parts.presidente', new Date('2024-06-01')],
      ['pub-A', KEY, new Date('2024-01-01')],
      // pubB only has KEY data, more recent
      ['pub-B', KEY, new Date('2024-03-01')],
    ]);

    const result = selectPublisher([pubA, pubB], KEY, rotationMap, 42);
    // pubA has older date for KEY → wins
    expect(result!.id).toBe('pub-A');
  });
});
