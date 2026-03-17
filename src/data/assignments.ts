import { prisma } from '@/data/prisma';
import { PublisherStatus } from '@/generated/prisma/enums';
import { FIXED_PARTS_TEMPLATE } from '@/lib/constants/meeting-parts';
import type {
  PublisherCandidate,
  ManualPublisherCandidate,
  PartSlot,
  RotationMap,
  ExistingAssignment,
  SlotAssignment,
} from '@/lib/assignment-engine/types';
import { getEligibilityKey } from '@/lib/assignment-engine/eligibility';

// ─── tituloKey Lookup ─────────────────────────────────────────────────

/**
 * Build a set of all known tituloKeys from the fixed parts template.
 * If a part's `titulo` matches one of these, it's a fixed part
 * and its titulo IS the tituloKey.
 */
const KNOWN_TITULO_KEYS = new Set(FIXED_PARTS_TEMPLATE.map((t) => t.tituloKey));

/**
 * Derives the tituloKey for a part record.
 * Fixed parts store the i18n key (e.g., "meetings.parts.presidente") in titulo.
 * Dynamic parts store a user-defined title — no tituloKey.
 */
function deriveTituloKey(titulo: string | null): string | undefined {
  if (titulo && KNOWN_TITULO_KEYS.has(titulo)) {
    return titulo;
  }
  return undefined;
}

// ─── Repository Functions ─────────────────────────────────────────────

/**
 * Get eligible publishers pre-filtered by base prerequisites (REQ-ELIG-01).
 * Returns minimal data needed by the engine.
 */
export async function getEligiblePublishers(): Promise<PublisherCandidate[]> {
  const publishers = await prisma.publisher.findMany({
    where: {
      habilitadoVMC: true,
      estado: PublisherStatus.ACTIVE,
      skipAssignment: false,
      deletedAt: null,
    },
    select: {
      id: true,
      nombre: true,
      sexo: true,
      rol: true,
      estado: true,
      habilitadoVMC: true,
      skipAssignment: true,
    },
  });

  return publishers;
}

/**
 * Get publishers for manual override candidate list (RF-MANUAL).
 * Relaxed prerequisites: includes skipAssignment=true and those with observaciones.
 * Only hard prerequisites enforced: habilitadoVMC=true, estado=ACTIVE.
 */
export async function getManualCandidatePublishers(): Promise<
  ManualPublisherCandidate[]
> {
  const publishers = await prisma.publisher.findMany({
    where: {
      habilitadoVMC: true,
      estado: PublisherStatus.ACTIVE,
      deletedAt: null,
    },
    select: {
      id: true,
      nombre: true,
      sexo: true,
      rol: true,
      estado: true,
      habilitadoVMC: true,
      skipAssignment: true,
      observaciones: true,
    },
  });

  return publishers;
}

/**
 * Get parts for a meeting week, mapped to the engine's PartSlot type.
 * Derives tituloKey for fixed parts from the stored titulo field.
 */
export async function getWeekParts(weekId: string): Promise<PartSlot[]> {
  const parts = await prisma.meetingPart.findMany({
    where: { meetingWeekId: weekId },
    orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
  });

  return parts.map((p) => ({
    id: p.id,
    seccion: p.seccion,
    tipo: p.tipo,
    titulo: p.titulo,
    orden: p.orden,
    sala: p.sala,
    requiereAyudante: p.requiereAyudante,
    tituloKey: deriveTituloKey(p.titulo),
  }));
}

/**
 * Get existing assignments for a week's parts.
 */
export async function getExistingAssignments(
  weekId: string
): Promise<ExistingAssignment[]> {
  const assignments = await prisma.assignment.findMany({
    where: {
      meetingPart: {
        meetingWeekId: weekId,
      },
    },
    select: {
      meetingPartId: true,
      publisherId: true,
      helperId: true,
    },
  });

  return assignments.map((a) => ({
    partId: a.meetingPartId,
    publisherId: a.publisherId,
    helperId: a.helperId,
  }));
}

/**
 * Build rotation map from AssignmentHistory.
 * Groups by publisherId + eligibilityKey, takes the MAX(fecha) for each.
 *
 * The eligibility key is derived from section+tipo+titulo using the same
 * logic as the engine's getEligibilityKey().
 */
export async function getRotationData(): Promise<RotationMap> {
  const history = await prisma.assignmentHistory.findMany({
    select: {
      publisherId: true,
      fecha: true,
      seccion: true,
      tipo: true,
      titulo: true,
      sala: true,
    },
    orderBy: { fecha: 'desc' },
  });

  const rotationMap: RotationMap = new Map();

  for (const record of history) {
    // Build a temporary PartSlot to derive the eligibility key
    const pseudoPart: PartSlot = {
      id: '',
      seccion: record.seccion,
      tipo: record.tipo,
      titulo: record.titulo,
      orden: 0,
      sala: record.sala,
      requiereAyudante: false,
      tituloKey: deriveTituloKey(record.titulo),
    };

    const eligKey = getEligibilityKey(pseudoPart);

    if (!rotationMap.has(record.publisherId)) {
      rotationMap.set(record.publisherId, new Map());
    }

    const publisherMap = rotationMap.get(record.publisherId)!;

    // Keep only the most recent date for each eligibility key
    const existing = publisherMap.get(eligKey);
    if (!existing || record.fecha > existing) {
      publisherMap.set(eligKey, record.fecha);
    }
  }

  return rotationMap;
}

/**
 * Save engine results to database in a single transaction (REQ-PER-01).
 * Creates/updates Assignment records and creates AssignmentHistory records.
 * Updates week status to ASSIGNED (REQ-PER-03).
 */
export async function saveAssignments(
  weekId: string,
  assignments: SlotAssignment[],
  weekFechaInicio: Date
): Promise<void> {
  // Load parts for this week to build denormalized history records
  const weekParts = await prisma.meetingPart.findMany({
    where: { meetingWeekId: weekId },
  });
  const partsById = new Map(weekParts.map((p) => [p.id, p]));

  const semana = formatWeekLabel(weekFechaInicio);

  await prisma.$transaction(async (tx) => {
    // 1. Upsert Assignment records
    for (const a of assignments) {
      await tx.assignment.upsert({
        where: { meetingPartId: a.partId },
        create: {
          meetingPartId: a.partId,
          publisherId: a.publisherId,
          helperId: a.helperId ?? null,
        },
        update: {
          publisherId: a.publisherId,
          helperId: a.helperId ?? null,
        },
      });
    }

    // 2. Create AssignmentHistory records for rotation tracking (REQ-PER-02)
    for (const a of assignments) {
      const part = partsById.get(a.partId);
      if (!part) continue;

      // Titular history record
      await tx.assignmentHistory.create({
        data: {
          fecha: weekFechaInicio,
          semana,
          seccion: part.seccion,
          tipo: part.tipo,
          titulo: part.titulo,
          sala: part.sala,
          publisherId: a.publisherId,
          publisherNombre: a.publisherNombre,
          helperId: a.helperId ?? null,
          helperNombre: a.helperNombre ?? null,
        },
      });
    }

    // 3. Update week status to ASSIGNED (REQ-PER-03)
    await tx.meetingWeek.update({
      where: { id: weekId },
      data: { estado: 'ASSIGNED' },
    });
  });
}

/**
 * Clear all assignments for a week (for full regeneration mode).
 * Deletes Assignment records and corresponding AssignmentHistory.
 * Resets week status to DRAFT.
 */
export async function clearAssignments(weekId: string): Promise<void> {
  const week = await prisma.meetingWeek.findUnique({
    where: { id: weekId },
    select: { fechaInicio: true },
  });
  if (!week) throw new Error('Week not found');

  const partIds = await prisma.meetingPart.findMany({
    where: { meetingWeekId: weekId },
    select: { id: true },
  });
  const ids = partIds.map((p) => p.id);

  await prisma.$transaction(async (tx) => {
    // Delete assignments for all parts in this week
    await tx.assignment.deleteMany({
      where: { meetingPartId: { in: ids } },
    });

    // Delete history records for this week's date
    await tx.assignmentHistory.deleteMany({
      where: { fecha: week.fechaInicio },
    });

    // Reset week status to DRAFT
    await tx.meetingWeek.update({
      where: { id: weekId },
      data: { estado: 'DRAFT' },
    });
  });
}

// ─── Manual Override ──────────────────────────────────────────────────

/**
 * Override a single assignment slot (titular or helper) in a transaction.
 * Upserts the Assignment record and syncs AssignmentHistory.
 *
 * For titular: updates publisherId, deletes old history, creates new.
 * For helper: updates helperId only (history tracks titular).
 */
export async function overrideSingleAssignment(
  partId: string,
  role: 'titular' | 'helper',
  newPublisherId: string,
  weekFechaInicio: Date
): Promise<void> {
  const part = await prisma.meetingPart.findUnique({
    where: { id: partId },
    include: {
      assignment: {
        include: {
          publisher: { select: { id: true, nombre: true } },
          helper: { select: { id: true, nombre: true } },
        },
      },
    },
  });
  if (!part) throw new Error('Part not found');

  const newPublisher = await prisma.publisher.findUnique({
    where: { id: newPublisherId },
    select: { id: true, nombre: true },
  });
  if (!newPublisher) throw new Error('Publisher not found');

  const semana = formatWeekLabel(weekFechaInicio);

  await prisma.$transaction(async (tx) => {
    if (role === 'helper') {
      // Helper override: just update the helperId on the Assignment
      if (!part.assignment) {
        throw new Error('Cannot assign helper — no titular assignment exists');
      }

      await tx.assignment.update({
        where: { meetingPartId: partId },
        data: { helperId: newPublisherId },
      });

      // Update history record's helperId+helperNombre
      await tx.assignmentHistory.updateMany({
        where: {
          fecha: weekFechaInicio,
          seccion: part.seccion,
          tipo: part.tipo,
          titulo: part.titulo,
          sala: part.sala,
          publisherId: part.assignment.publisherId,
        },
        data: {
          helperId: newPublisherId,
          helperNombre: newPublisher.nombre,
        },
      });
    } else {
      // Titular override: upsert Assignment + sync history
      const oldPublisherId = part.assignment?.publisherId;

      // 1. Upsert the Assignment record
      await tx.assignment.upsert({
        where: { meetingPartId: partId },
        create: {
          meetingPartId: partId,
          publisherId: newPublisherId,
          helperId: part.assignment?.helperId ?? null,
        },
        update: {
          publisherId: newPublisherId,
        },
      });

      // 2. Delete old history record for this exact slot
      if (oldPublisherId) {
        await tx.assignmentHistory.deleteMany({
          where: {
            fecha: weekFechaInicio,
            seccion: part.seccion,
            tipo: part.tipo,
            titulo: part.titulo,
            sala: part.sala,
            publisherId: oldPublisherId,
          },
        });
      }

      // 3. Create new history record
      await tx.assignmentHistory.create({
        data: {
          fecha: weekFechaInicio,
          semana,
          seccion: part.seccion,
          tipo: part.tipo,
          titulo: part.titulo,
          sala: part.sala,
          publisherId: newPublisherId,
          publisherNombre: newPublisher.nombre,
          helperId: part.assignment?.helperId ?? null,
          helperNombre: part.assignment?.helper?.nombre ?? null,
        },
      });
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Formats a date as an ISO week label (e.g., "2026-W12").
 */
function formatWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}
