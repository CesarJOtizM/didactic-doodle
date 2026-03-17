import { AttendantRole } from '@/generated/prisma/enums';
import type {
  AttendantCandidate,
  AttendantRotationMap,
} from '@/data/attendants';

// ─── Types ───────────────────────────────────────────────────────────

export type AttendantSlot = {
  attendantRole: AttendantRole;
  publisherId: string;
  publisherNombre: string;
};

export type AttendantEngineOutput = {
  assignments: AttendantSlot[];
  unfilled: { role: AttendantRole; reason: string }[];
};

// ─── Flag Mapping ────────────────────────────────────────────────────

const ROLE_FLAG_MAP: Record<
  AttendantRole,
  'habilitadoAcomodador' | 'habilitadoMicrofono'
> = {
  [AttendantRole.DOORMAN]: 'habilitadoAcomodador',
  [AttendantRole.ATTENDANT]: 'habilitadoAcomodador',
  [AttendantRole.MICROPHONE_1]: 'habilitadoMicrofono',
  [AttendantRole.MICROPHONE_2]: 'habilitadoMicrofono',
};

export { ROLE_FLAG_MAP };

// ─── Order ───────────────────────────────────────────────────────────

const ATTENDANT_ROLES_ORDER: AttendantRole[] = [
  AttendantRole.DOORMAN,
  AttendantRole.ATTENDANT,
  AttendantRole.MICROPHONE_1,
  AttendantRole.MICROPHONE_2,
];

// ─── Engine ──────────────────────────────────────────────────────────

/**
 * Generate attendant assignments for one meeting.
 * Pure function — no side effects.
 *
 * Algorithm per role:
 * 1. Get candidates (pre-filtered by flag)
 * 2. Remove already-assigned in this batch
 * 3. Optionally deprioritize VMC-assigned publishers (soft constraint)
 * 4. Select by rotation (oldest first)
 */
export function generateAttendantAssignments(
  candidatesByFlag: Record<string, AttendantCandidate[]>,
  rotationByRole: Record<string, AttendantRotationMap>,
  vmcAssignedIds?: Set<string>
): AttendantEngineOutput {
  const assignments: AttendantSlot[] = [];
  const unfilled: { role: AttendantRole; reason: string }[] = [];
  const usedIds = new Set<string>();

  for (const role of ATTENDANT_ROLES_ORDER) {
    const flag = ROLE_FLAG_MAP[role];
    const allCandidates = candidatesByFlag[flag] ?? [];
    const rotation = rotationByRole[role] ?? new Map();

    // Filter out already-used publishers in this batch
    const candidates = allCandidates.filter((c) => !usedIds.has(c.id));

    if (candidates.length === 0) {
      unfilled.push({ role, reason: 'No eligible candidates' });
      continue;
    }

    // Soft VMC constraint: separate into preferred (no VMC) and fallback (has VMC)
    let preferred = candidates;
    if (vmcAssignedIds && vmcAssignedIds.size > 0) {
      const noVMC = candidates.filter((c) => !vmcAssignedIds.has(c.id));
      if (noVMC.length > 0) {
        preferred = noVMC;
      }
      // If all candidates have VMC assignments, use full list (soft constraint)
    }

    // Select by rotation: oldest assignment date first
    const selected = selectByRotation(preferred, rotation);

    if (!selected) {
      unfilled.push({ role, reason: 'Selection returned no candidate' });
      continue;
    }

    assignments.push({
      attendantRole: role,
      publisherId: selected.id,
      publisherNombre: selected.nombre,
    });
    usedIds.add(selected.id);
  }

  return { assignments, unfilled };
}

/**
 * Select candidate with oldest last-assignment date.
 * Reuses same logic as VMC selector but simplified (no seed needed).
 */
function selectByRotation(
  candidates: AttendantCandidate[],
  rotationMap: AttendantRotationMap
): AttendantCandidate | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const EPOCH_ZERO = new Date(0);

  const withDates = candidates.map((c) => ({
    candidate: c,
    lastDate: rotationMap.get(c.id) ?? EPOCH_ZERO,
  }));

  withDates.sort((a, b) => a.lastDate.getTime() - b.lastDate.getTime());

  // Find all tied at oldest
  const oldestTime = withDates[0].lastDate.getTime();
  const tied = withDates.filter((w) => w.lastDate.getTime() === oldestTime);

  // Random tiebreak
  const index = Math.floor(Math.random() * tied.length);
  return tied[index].candidate;
}
