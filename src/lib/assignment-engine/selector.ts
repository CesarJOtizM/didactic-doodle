import type { PublisherCandidate, RotationMap } from './types';

// ─── Seeded PRNG ──────────────────────────────────────────────────────

/**
 * Simple seeded PRNG (mulberry32).
 * Returns a function that produces deterministic numbers in [0, 1).
 */
function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Selects a publisher from the candidate pool using rotation-based priority.
 *
 * Algorithm (REQ-SEL-01):
 * 1. For each candidate, get their last-assignment date for this eligibilityKey
 * 2. No history → use epoch 0 (highest priority — never assigned wins)
 * 3. Sort ascending by date (oldest first)
 * 4. Find all candidates tied at the oldest date
 * 5. If tied: use seeded random for deterministic tests, or Math.random() if no seed
 * 6. Return winner or null if candidates is empty
 */
export function selectPublisher(
  candidates: PublisherCandidate[],
  eligibilityKey: string,
  rotationMap: RotationMap,
  seed?: number
): PublisherCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const EPOCH_ZERO = new Date(0);

  // Get last-assignment date for each candidate
  const withDates = candidates.map((candidate) => {
    const publisherRotation = rotationMap.get(candidate.id);
    const lastDate = publisherRotation?.get(eligibilityKey) ?? EPOCH_ZERO;
    return { candidate, lastDate };
  });

  // Sort ascending by date (oldest first — they get priority)
  withDates.sort((a, b) => a.lastDate.getTime() - b.lastDate.getTime());

  // Find all candidates tied at the oldest date
  const oldestTime = withDates[0].lastDate.getTime();
  const tied = withDates.filter(
    (item) => item.lastDate.getTime() === oldestTime
  );

  if (tied.length === 1) {
    return tied[0].candidate;
  }

  // Tiebreak: seeded random if seed provided, otherwise Math.random()
  const random = seed != null ? createSeededRandom(seed) : Math.random;
  const index = Math.floor(random() * tied.length);
  return tied[index].candidate;
}
