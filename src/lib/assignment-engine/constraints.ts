import type { PublisherCandidate, PartSlot, SlotAssignment } from './types';
import { getEligibilityKey } from './eligibility';

// ─── Individual Constraint Predicates ─────────────────────────────────

/**
 * Returns true if the publisher is already assigned to any part in this meeting.
 * REQ-SEL-01 step 3: one part per person per meeting.
 */
export function isAlreadyAssigned(
  publisherId: string,
  assignments: SlotAssignment[]
): boolean {
  return assignments.some(
    (a) => a.publisherId === publisherId || a.helperId === publisherId
  );
}

/**
 * Returns true if the publisher holds an exclusive role (Presidente or Encargado de escuela).
 * REQ-CON-01 rules 2 & 3: these roles cannot have any other part.
 */
export function isExclusive(
  publisherId: string,
  assignments: SlotAssignment[],
  parts: PartSlot[]
): boolean {
  const EXCLUSIVE_KEYS = new Set([
    'meetings.parts.presidente',
    'meetings.parts.schoolOverseer',
  ]);

  for (const assignment of assignments) {
    if (assignment.publisherId !== publisherId) continue;

    const part = parts.find((p) => p.id === assignment.partId);
    if (part) {
      const key = getEligibilityKey(part);
      if (EXCLUSIVE_KEYS.has(key)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns true if assigning this publisher to this part would create a
 * room conflict: same logical part type in the OTHER room.
 * REQ-CON-01 rule 4: auxiliary room must have completely different people.
 */
export function hasRoomConflict(
  publisherId: string,
  part: PartSlot,
  assignments: SlotAssignment[],
  parts: PartSlot[]
): boolean {
  const partKey = getEligibilityKey(part);

  for (const assignment of assignments) {
    if (
      assignment.publisherId !== publisherId &&
      assignment.helperId !== publisherId
    ) {
      continue;
    }

    const assignedPart = parts.find((p) => p.id === assignment.partId);
    if (!assignedPart) continue;

    const assignedKey = getEligibilityKey(assignedPart);

    // Same logical part type but different room = conflict
    // Compare base keys: for bible reading, bibleReading vs bibleReadingAux are related
    if (
      areSameLogicalPart(partKey, assignedKey) &&
      assignedPart.sala !== part.sala
    ) {
      return true;
    }

    // Also check by section+tipo for dynamic parts in different rooms
    if (
      part.seccion === assignedPart.seccion &&
      part.tipo === assignedPart.tipo &&
      part.sala !== assignedPart.sala
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if two eligibility keys refer to the same logical part
 * (e.g., bibleReading and bibleReadingAux).
 */
function areSameLogicalPart(key1: string, key2: string): boolean {
  // Bible reading main and aux
  const bibleReadingKeys = new Set([
    'meetings.parts.bibleReading',
    'meetings.parts.bibleReadingAux',
  ]);
  if (bibleReadingKeys.has(key1) && bibleReadingKeys.has(key2)) {
    return true;
  }

  // For dynamic parts, they're handled by the section+tipo+room check
  return false;
}

/**
 * Returns true if the publisher is already both a titular AND a helper in this meeting.
 * REQ-CON-01 rule 1: a person must not be titular AND ayudante.
 *
 * Actually, the constraint is simpler: if the publisher is already a titular,
 * they can't be a helper, and vice versa.
 */
export function isTitularAndHelper(
  publisherId: string,
  role: 'titular' | 'helper',
  assignments: SlotAssignment[]
): boolean {
  if (role === 'helper') {
    // Check if already assigned as titular
    return assignments.some((a) => a.publisherId === publisherId);
  }
  // Check if already assigned as helper
  return assignments.some((a) => a.helperId === publisherId);
}

// ─── Composite Constraint Filter ──────────────────────────────────────

/**
 * Filters candidates removing those who violate any hard constraint.
 * Used for TITULAR assignment.
 */
export function applyConstraints(
  candidates: PublisherCandidate[],
  part: PartSlot,
  currentAssignments: SlotAssignment[],
  allParts: PartSlot[]
): PublisherCandidate[] {
  return candidates.filter((candidate) => {
    // 1. Already assigned in this meeting (as titular or helper)
    if (isAlreadyAssigned(candidate.id, currentAssignments)) {
      return false;
    }

    // 2. Holds an exclusive role (Presidente / Encargado)
    if (isExclusive(candidate.id, currentAssignments, allParts)) {
      return false;
    }

    // 3. Room conflict (same part type in different room)
    if (hasRoomConflict(candidate.id, part, currentAssignments, allParts)) {
      return false;
    }

    return true;
  });
}

/**
 * Filters candidates for HELPER assignment.
 * Additional constraint: can't be the same person as the titular.
 */
export function applyHelperConstraints(
  candidates: PublisherCandidate[],
  part: PartSlot,
  titularId: string,
  currentAssignments: SlotAssignment[],
  allParts: PartSlot[]
): PublisherCandidate[] {
  return candidates.filter((candidate) => {
    // Can't be the titular of this part
    if (candidate.id === titularId) {
      return false;
    }

    // Already assigned in this meeting
    if (isAlreadyAssigned(candidate.id, currentAssignments)) {
      return false;
    }

    // Holds an exclusive role
    if (isExclusive(candidate.id, currentAssignments, allParts)) {
      return false;
    }

    // Titular+helper conflict: already a titular, can't be helper
    if (isTitularAndHelper(candidate.id, 'helper', currentAssignments)) {
      return false;
    }

    // Room conflict
    if (hasRoomConflict(candidate.id, part, currentAssignments, allParts)) {
      return false;
    }

    return true;
  });
}
