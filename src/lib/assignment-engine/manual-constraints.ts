import type {
  ManualPublisherCandidate,
  ManualCandidate,
  CandidateWarning,
  PartSlot,
  SlotAssignment,
  RotationMap,
} from './types';
import {
  isEligible,
  getEligibilityKey,
  getHelperEligibilityKey,
} from './eligibility';
import { isExclusive, hasRoomConflict, isAlreadyAssigned } from './constraints';

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Classifies all candidates for a given part+role in manual override context.
 *
 * Unlike the auto-engine which FILTERS candidates, this function CLASSIFIES
 * them as eligible / warning / blocked so the UI can display all options
 * with appropriate visual indicators.
 *
 * Hard constraints → blocked (cannot select)
 * Soft constraints → warning (selectable with warning)
 * No constraints → eligible
 *
 * Results sorted: eligible first (by oldest assignment), then warned, blocked last.
 */
export function classifyCandidates(
  publishers: ManualPublisherCandidate[],
  part: PartSlot,
  role: 'titular' | 'helper',
  currentAssignments: SlotAssignment[],
  allParts: PartSlot[],
  rotationMap: RotationMap,
  currentTitularId?: string
): ManualCandidate[] {
  const eligibilityKey =
    role === 'helper' ? getHelperEligibilityKey(part) : getEligibilityKey(part);

  const candidates: ManualCandidate[] = [];

  for (const publisher of publishers) {
    // For helper role, exclude the current titular
    if (role === 'helper' && currentTitularId === publisher.id) {
      continue;
    }

    const warnings: CandidateWarning[] = [];
    let blockReason: string | undefined;

    // ── HARD CONSTRAINTS (blocked) ──

    // H1: Role/gender eligibility check
    if (!isEligible(publisher, eligibilityKey)) {
      blockReason = 'meetings.override.blocked.ineligible';
    }

    // H2+H3: Exclusive role check (presidente/schoolOverseer already assigned)
    if (
      !blockReason &&
      isExclusive(publisher.id, currentAssignments, allParts)
    ) {
      blockReason = 'meetings.override.blocked.exclusiveRole';
    }

    // ── SOFT CONSTRAINTS (warnings, only if not already blocked) ──

    if (!blockReason) {
      // S1+S2: Already assigned in this meeting (non-exclusive role)
      if (isAlreadyAssigned(publisher.id, currentAssignments)) {
        warnings.push({
          type: 'duplicate_assignment',
          message: 'meetings.override.warnings.duplicateAssignment',
        });
      }

      // Room conflict: same part type in different room
      if (hasRoomConflict(publisher.id, part, currentAssignments, allParts)) {
        warnings.push({
          type: 'room_conflict',
          message: 'meetings.override.warnings.roomConflict',
        });
      }

      // S3: Publisher has observaciones
      if (publisher.observaciones) {
        warnings.push({
          type: 'has_observaciones',
          message: publisher.observaciones,
        });
      }

      // S4: Publisher has skipAssignment=true
      if (publisher.skipAssignment) {
        warnings.push({
          type: 'skip_assignment',
          message: 'meetings.override.warnings.skipAssignment',
        });
      }
    }

    // ── Determine status ──

    const status: ManualCandidate['status'] = blockReason
      ? 'blocked'
      : warnings.length > 0
        ? 'warning'
        : 'eligible';

    // ── Get last assignment date for rotation display ──

    const publisherRotation = rotationMap.get(publisher.id);
    const lastAssignmentDate = publisherRotation?.get(eligibilityKey) ?? null;

    candidates.push({
      id: publisher.id,
      nombre: publisher.nombre,
      lastAssignmentDate,
      status,
      warnings,
      blockReason,
    });
  }

  // ── Sort: eligible first (oldest assignment), then warned, blocked last ──
  return candidates.sort((a, b) => {
    const statusOrder = { eligible: 0, warning: 1, blocked: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Within same status, sort by oldest last assignment (null = never assigned = first)
    const aDate = a.lastAssignmentDate?.getTime() ?? 0;
    const bDate = b.lastAssignmentDate?.getTime() ?? 0;
    return aDate - bDate;
  });
}
