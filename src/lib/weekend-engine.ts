import type { Gender, Role, PublisherStatus } from '@/generated/prisma/enums';
import type { RotationMap } from '@/lib/assignment-engine/types';
import { selectPublisher } from '@/lib/assignment-engine/selector';

// ─── Types ───────────────────────────────────────────────────────────

export type WeekendSlot =
  | 'presidente'
  | 'conductor'
  | 'lector'
  | 'oracionFinal';

/**
 * Minimal publisher data needed by the weekend engine.
 * Structurally compatible with PublisherCandidate (includes habilitadoVMC)
 * so it can be passed directly to selectPublisher().
 */
export type WeekendCandidate = {
  id: string;
  nombre: string;
  sexo: Gender;
  rol: Role;
  estado: PublisherStatus;
  habilitadoVMC: boolean;
  habilitadoOracion: boolean;
  habilitadoLectura: boolean;
  habilitadoPresidenciaFinDeSemana: boolean;
  habilitadoConductorAtalaya: boolean;
  skipAssignment: boolean;
};

/** publisherId -> slotType -> lastAssignmentDate */
export type WeekendRotationMap = RotationMap;

export type WeekendExisting = {
  presidenteId: string | null;
  conductorId: string | null;
  lectorId: string | null;
  oracionFinalId: string | null;
};

export type WeekendEngineConfig = {
  mode: 'partial' | 'full';
  seed?: number;
};

export type WeekendSlotAssignment = {
  slot: WeekendSlot;
  publisherId: string;
  publisherNombre: string;
};

export type WeekendEngineOutput = {
  assignments: WeekendSlotAssignment[];
  unfilled: { slot: WeekendSlot; reason: string }[];
  oracionInicialId: string | null;
  stats: {
    totalSlots: number;
    filled: number;
    unfilled: number;
    skipped: number;
  };
};

// ─── Eligibility Map ─────────────────────────────────────────────────

const WEEKEND_SLOTS_ORDER: WeekendSlot[] = [
  'presidente',
  'conductor',
  'lector',
  'oracionFinal',
];

const ELIGIBLE_PRESIDENTE_ROLES: Set<Role> = new Set([
  'ELDER' as Role,
  'MINISTERIAL_SERVANT' as Role,
]);

type EligibilityPredicate = (candidate: WeekendCandidate) => boolean;

const ELIGIBILITY_MAP: Record<WeekendSlot, EligibilityPredicate> = {
  presidente: (c) =>
    ELIGIBLE_PRESIDENTE_ROLES.has(c.rol) && c.habilitadoPresidenciaFinDeSemana,
  conductor: (c) => c.habilitadoConductorAtalaya,
  lector: (c) => c.habilitadoLectura,
  oracionFinal: (c) => c.habilitadoOracion,
};

// ─── Slot-to-existing field mapping ──────────────────────────────────

const EXISTING_FIELD_MAP: Record<WeekendSlot, keyof WeekendExisting> = {
  presidente: 'presidenteId',
  conductor: 'conductorId',
  lector: 'lectorId',
  oracionFinal: 'oracionFinalId',
};

// ─── Prerequisites ───────────────────────────────────────────────────

/**
 * Weekend prerequisites: publisher must be ACTIVE and not flagged to skip.
 * NOTE: habilitadoVMC is NOT checked — weekend is independent from midweek.
 */
function passesWeekendPrerequisites(candidate: WeekendCandidate): boolean {
  return (candidate.estado as string) === 'ACTIVE' && !candidate.skipAssignment;
}

// ─── Engine ──────────────────────────────────────────────────────────

/**
 * Generate weekend meeting assignments.
 * Pure function — no side effects, no database access.
 *
 * Algorithm:
 * 1. Iterate slots in priority order (most restrictive first)
 * 2. For each slot: filter eligible -> exclude used -> select via rotation
 * 3. Auto-set oracionInicialId = presidenteId
 * 4. Return assignments + unfilled + stats
 */
export function generateWeekendAssignments(
  candidates: WeekendCandidate[],
  rotationMap: WeekendRotationMap,
  existing: WeekendExisting,
  config: WeekendEngineConfig
): WeekendEngineOutput {
  const assignments: WeekendSlotAssignment[] = [];
  const unfilled: { slot: WeekendSlot; reason: string }[] = [];
  const usedIds = new Set<string>();
  let skipped = 0;

  // In partial mode, pre-fill usedIds from existing assignments
  if (config.mode === 'partial') {
    for (const slot of WEEKEND_SLOTS_ORDER) {
      const existingId = existing[EXISTING_FIELD_MAP[slot]];
      if (existingId != null) {
        usedIds.add(existingId);
      }
    }
  }

  for (const slot of WEEKEND_SLOTS_ORDER) {
    // Partial: skip if already assigned
    if (
      config.mode === 'partial' &&
      existing[EXISTING_FIELD_MAP[slot]] != null
    ) {
      skipped++;
      continue;
    }

    // Step 1: Filter eligible (prerequisites + slot-specific + not already used)
    const eligible = candidates.filter(
      (c) =>
        passesWeekendPrerequisites(c) &&
        ELIGIBILITY_MAP[slot](c) &&
        !usedIds.has(c.id)
    );

    if (eligible.length === 0) {
      unfilled.push({ slot, reason: 'No eligible candidates' });
      continue;
    }

    // Step 2: Select via rotation
    // selectPublisher accepts PublisherCandidate[] — WeekendCandidate is a
    // structural superset (has all required fields), so this is type-safe.
    const selected = selectPublisher(eligible, slot, rotationMap, config.seed);

    if (!selected) {
      unfilled.push({ slot, reason: 'Selection returned no candidate' });
      continue;
    }

    assignments.push({
      slot,
      publisherId: selected.id,
      publisherNombre: selected.nombre,
    });
    usedIds.add(selected.id);
  }

  // Auto-set oracion apertura = presidente
  const presidenteAssignment = assignments.find((a) => a.slot === 'presidente');
  const oracionInicialId =
    presidenteAssignment?.publisherId ?? existing.presidenteId;

  return {
    assignments,
    unfilled,
    oracionInicialId,
    stats: {
      totalSlots: WEEKEND_SLOTS_ORDER.length,
      filled: assignments.length,
      unfilled: unfilled.length,
      skipped,
    },
  };
}
