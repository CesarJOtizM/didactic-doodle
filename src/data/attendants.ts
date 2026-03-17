import { prisma } from '@/data/prisma';
import { PublisherStatus, Gender, Role } from '@/generated/prisma/enums';
import type {
  AttendantRole,
  MeetingType,
  AttendantAssignment,
} from '@/generated/prisma/client';

// ─── Types ───────────────────────────────────────────────────────────

export type AttendantCandidate = {
  id: string;
  nombre: string;
};

/** publisherId → lastDate for a specific attendantRole */
export type AttendantRotationMap = Map<string, Date>;

export type WeekAttendantData = {
  midweek: AttendantAssignment[];
  weekend: AttendantAssignment[];
};

// ─── Repository Functions ────────────────────────────────────────────

/**
 * Get eligible publishers for an attendant role.
 * Eligibility: Male, baptized (Elder/Ministerial/BaptizedPublisher),
 * ACTIVE, skipAssignment=false, corresponding flag active.
 */
export async function getEligibleAttendants(
  flag: 'habilitadoAcomodador' | 'habilitadoMicrofono'
): Promise<AttendantCandidate[]> {
  const publishers = await prisma.publisher.findMany({
    where: {
      sexo: Gender.MALE,
      rol: {
        in: [Role.ELDER, Role.MINISTERIAL_SERVANT, Role.BAPTIZED_PUBLISHER],
      },
      estado: PublisherStatus.ACTIVE,
      skipAssignment: false,
      deletedAt: null,
      [flag]: true,
    },
    select: {
      id: true,
      nombre: true,
    },
    orderBy: { nombre: 'asc' },
  });

  return publishers;
}

/**
 * Get eligible publishers for manual attendant override.
 * Relaxed: includes skipAssignment=true.
 */
export async function getManualAttendantCandidates(
  flag: 'habilitadoAcomodador' | 'habilitadoMicrofono'
): Promise<AttendantCandidate[]> {
  const publishers = await prisma.publisher.findMany({
    where: {
      sexo: Gender.MALE,
      rol: {
        in: [Role.ELDER, Role.MINISTERIAL_SERVANT, Role.BAPTIZED_PUBLISHER],
      },
      estado: PublisherStatus.ACTIVE,
      deletedAt: null,
      [flag]: true,
    },
    select: {
      id: true,
      nombre: true,
    },
    orderBy: { nombre: 'asc' },
  });

  return publishers;
}

/**
 * Build rotation map for a specific attendant role.
 * Groups by publisherId, takes MAX(fecha) across ALL meeting types.
 */
export async function getAttendantRotation(
  attendantRole: AttendantRole
): Promise<AttendantRotationMap> {
  const records = await prisma.attendantAssignment.findMany({
    where: { attendantRole },
    select: {
      publisherId: true,
      fecha: true,
    },
    orderBy: { fecha: 'desc' },
  });

  const rotationMap: AttendantRotationMap = new Map();

  for (const record of records) {
    const existing = rotationMap.get(record.publisherId);
    if (!existing || record.fecha > existing) {
      rotationMap.set(record.publisherId, record.fecha);
    }
  }

  return rotationMap;
}

/**
 * Get attendant assignments for a week (by fecha range and meeting type).
 */
export async function getWeekAttendants(
  weekFechaInicio: Date,
  meetingType: MeetingType
): Promise<
  (AttendantAssignment & { publisher: { id: string; nombre: string } })[]
> {
  return prisma.attendantAssignment.findMany({
    where: {
      fecha: weekFechaInicio,
      meetingType,
    },
    include: {
      publisher: { select: { id: true, nombre: true } },
    },
    orderBy: { attendantRole: 'asc' },
  });
}

/**
 * Save attendant assignments for a week + meeting type in a transaction.
 * Clears existing for that fecha+meetingType, then creates new.
 */
export async function saveAttendantAssignments(
  fecha: Date,
  meetingType: MeetingType,
  assignments: { attendantRole: AttendantRole; publisherId: string }[]
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Clear existing for this date + meeting type
    await tx.attendantAssignment.deleteMany({
      where: { fecha, meetingType },
    });

    // Create new assignments
    for (const a of assignments) {
      await tx.attendantAssignment.create({
        data: {
          publisherId: a.publisherId,
          meetingType,
          attendantRole: a.attendantRole,
          fecha,
        },
      });
    }
  });
}

/**
 * Clear all attendant assignments for a week + meeting type.
 */
export async function clearAttendantAssignments(
  fecha: Date,
  meetingType: MeetingType
): Promise<void> {
  await prisma.attendantAssignment.deleteMany({
    where: { fecha, meetingType },
  });
}

/**
 * Override a single attendant assignment.
 * Deletes existing for that fecha+meetingType+role, creates new.
 */
export async function overrideAttendantAssignment(
  fecha: Date,
  meetingType: MeetingType,
  attendantRole: AttendantRole,
  publisherId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.attendantAssignment.deleteMany({
      where: { fecha, meetingType, attendantRole },
    });

    await tx.attendantAssignment.create({
      data: {
        publisherId,
        meetingType,
        attendantRole,
        fecha,
      },
    });
  });
}

// ─── Overview Query ──────────────────────────────────────────────────

export type AttendantOverviewRow = {
  fecha: Date;
  meetingType: MeetingType;
  assignments: {
    attendantRole: AttendantRole;
    publisherId: string;
    publisherNombre: string;
  }[];
};

/**
 * Get recent attendant assignments grouped by fecha + meetingType.
 * Returns the last N meeting dates, newest first.
 */
export async function getRecentAttendantAssignments(
  limit = 20
): Promise<AttendantOverviewRow[]> {
  const records = await prisma.attendantAssignment.findMany({
    include: {
      publisher: { select: { id: true, nombre: true } },
    },
    orderBy: [
      { fecha: 'desc' },
      { meetingType: 'asc' },
      { attendantRole: 'asc' },
    ],
  });

  // Group by fecha + meetingType
  const groupMap = new Map<string, AttendantOverviewRow>();

  for (const record of records) {
    const key = `${record.fecha.toISOString()}_${record.meetingType}`;
    let group = groupMap.get(key);
    if (!group) {
      group = {
        fecha: record.fecha,
        meetingType: record.meetingType,
        assignments: [],
      };
      groupMap.set(key, group);
    }
    group.assignments.push({
      attendantRole: record.attendantRole,
      publisherId: record.publisherId,
      publisherNombre: record.publisher.nombre,
    });
  }

  // Sort groups by date descending, take limit
  const groups = Array.from(groupMap.values())
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, limit);

  return groups;
}

/**
 * Get publisher IDs that have VMC assignments in a given week.
 * Used for soft constraint (RF-ATT-04).
 */
export async function getVMCAssignedPublisherIds(
  weekId: string
): Promise<Set<string>> {
  const assignments = await prisma.assignment.findMany({
    where: {
      meetingPart: { meetingWeekId: weekId },
    },
    select: {
      publisherId: true,
      helperId: true,
    },
  });

  const ids = new Set<string>();
  for (const a of assignments) {
    ids.add(a.publisherId);
    if (a.helperId) ids.add(a.helperId);
  }
  return ids;
}
