import type {
  PartSlot,
  PublisherCandidate,
  RotationMap,
  ExistingAssignment,
  EngineConfig,
  SlotAssignment,
  UnfilledSlot,
  EngineOutput,
} from './types';
import {
  getEligibleCandidates,
  getEligibleHelpers,
  getEligibilityKey,
  getHelperEligibilityKey,
} from './eligibility';
import { applyConstraints, applyHelperConstraints } from './constraints';
import { getAssignmentOrder } from './order';
import { selectPublisher } from './selector';

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Generates assignments for all parts in a meeting week.
 *
 * Pure function — no side effects, no database access.
 * Takes immutable inputs and returns a complete assignment proposal.
 *
 * Algorithm:
 * 1. Order parts by priority (most restrictive first)
 * 2. For each part, find eligible candidates → apply constraints → select
 * 3. Second pass: assign helpers for parts with requiereAyudante
 * 4. Return assignments + unfilled slots + stats
 */
export function generateAssignments(
  parts: PartSlot[],
  publishers: PublisherCandidate[],
  rotationMap: RotationMap,
  existingAssignments: ExistingAssignment[],
  config: EngineConfig
): EngineOutput {
  const orderedParts = getAssignmentOrder(parts);
  const assignments: SlotAssignment[] = [];
  const unfilled: UnfilledSlot[] = [];
  let skipped = 0;

  // Build a lookup for existing assignments (for partial mode)
  const existingMap = new Map<string, ExistingAssignment>();
  for (const ea of existingAssignments) {
    existingMap.set(ea.partId, ea);
  }

  // In partial mode, seed currentAssignments with existing ones
  if (config.mode === 'partial') {
    for (const ea of existingAssignments) {
      const part = parts.find((p) => p.id === ea.partId);
      if (!part) continue;

      const publisher = publishers.find((p) => p.id === ea.publisherId);
      const helper = ea.helperId
        ? publishers.find((p) => p.id === ea.helperId)
        : undefined;

      assignments.push({
        partId: ea.partId,
        publisherId: ea.publisherId,
        publisherNombre: publisher?.nombre ?? 'Unknown',
        helperId: helper?.id,
        helperNombre: helper?.nombre,
      });
    }
  }

  // ── FIRST PASS: Assign titulares ──

  for (const part of orderedParts) {
    // In partial mode, skip parts that already have an assignment
    if (config.mode === 'partial' && existingMap.has(part.id)) {
      skipped++;
      continue;
    }

    // Step 1: Get eligible candidates (prerequisites + eligibility matrix)
    const eligible = getEligibleCandidates(publishers, part);

    if (eligible.length === 0) {
      unfilled.push({
        partId: part.id,
        partTitle: part.titulo ?? part.tituloKey ?? 'Unknown part',
        section: part.seccion,
        room: part.sala,
        reason: 'No eligible candidates',
      });
      continue;
    }

    // Step 2: Apply hard constraints
    const constrained = applyConstraints(eligible, part, assignments, parts);

    if (constrained.length === 0) {
      unfilled.push({
        partId: part.id,
        partTitle: part.titulo ?? part.tituloKey ?? 'Unknown part',
        section: part.seccion,
        room: part.sala,
        reason: 'All eligible candidates already assigned or constrained',
      });
      continue;
    }

    // Step 3: Select publisher via rotation
    const eligibilityKey = getEligibilityKey(part);
    const selected = selectPublisher(
      constrained,
      eligibilityKey,
      rotationMap,
      config.seed
    );

    if (!selected) {
      unfilled.push({
        partId: part.id,
        partTitle: part.titulo ?? part.tituloKey ?? 'Unknown part',
        section: part.seccion,
        room: part.sala,
        reason: 'Selection returned no candidate',
      });
      continue;
    }

    // Step 4: Add to assignments
    assignments.push({
      partId: part.id,
      publisherId: selected.id,
      publisherNombre: selected.nombre,
    });
  }

  // ── SECOND PASS: Assign helpers ──

  const partsNeedingHelpers = orderedParts.filter((p) => p.requiereAyudante);

  for (const part of partsNeedingHelpers) {
    // Find the assignment for this part's titular
    const assignment = assignments.find((a) => a.partId === part.id);
    if (!assignment) continue; // No titular assigned — can't assign helper

    // In partial mode, skip if helper already assigned
    if (config.mode === 'partial') {
      const existing = existingMap.get(part.id);
      if (existing?.helperId) continue;
    }

    // Already has a helper (from existing assignments in partial mode)
    if (assignment.helperId) continue;

    // Get eligible helpers (pass titular gender for same-gender filtering)
    const titular = publishers.find((p) => p.id === assignment.publisherId);
    const eligible = getEligibleHelpers(publishers, part, titular?.sexo);
    const helperKey = getHelperEligibilityKey(part);

    // Apply helper-specific constraints
    const constrained = applyHelperConstraints(
      eligible,
      part,
      assignment.publisherId,
      assignments,
      parts
    );

    if (constrained.length === 0) {
      // Don't add to unfilled — the titular is assigned, just no helper available
      continue;
    }

    const selected = selectPublisher(
      constrained,
      helperKey,
      rotationMap,
      config.seed
    );

    if (selected) {
      assignment.helperId = selected.id;
      assignment.helperNombre = selected.nombre;
    }
  }

  // ── Build stats ──

  // Only count non-existing assignments (new ones we attempted to fill)
  const newAssignments = assignments.filter(
    (a) => config.mode === 'full' || !existingMap.has(a.partId)
  );

  return {
    assignments: config.mode === 'full' ? assignments : assignments,
    unfilled,
    stats: {
      totalSlots: parts.length,
      filled: newAssignments.length,
      unfilled: unfilled.length,
      skipped,
    },
  };
}
