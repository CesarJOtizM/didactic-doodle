import { prisma } from '@/data/prisma';
import { PublisherStatus, Gender, Role } from '@/generated/prisma/enums';
import type { WeekendMeeting } from '@/generated/prisma/client';
import type {
  WeekendCandidate as EngineCandidate,
  WeekendRotationMap,
  WeekendSlot,
} from '@/lib/weekend-engine';

// ─── Types ───────────────────────────────────────────────────────────

export type WeekendMeetingWithPublishers = WeekendMeeting & {
  presidente: { id: string; nombre: string } | null;
  conductor: { id: string; nombre: string } | null;
  lector: { id: string; nombre: string } | null;
  oracionInicial: { id: string; nombre: string } | null;
  oracionFinal: { id: string; nombre: string } | null;
};

export type WeekendMeetingFormData = {
  discursoTema?: string;
  discursoOrador?: string;
  presidenteId?: string | null;
  conductorId?: string | null;
  lectorId?: string | null;
  oracionFinalId?: string | null;
};

export type WeekendCandidate = {
  id: string;
  nombre: string;
};

// ─── Repository Functions ────────────────────────────────────────────

/**
 * Get weekend meeting for a week with publisher relations.
 */
export async function getWeekendMeeting(
  weekId: string
): Promise<WeekendMeetingWithPublishers | null> {
  return prisma.weekendMeeting.findUnique({
    where: { meetingWeekId: weekId },
    include: {
      presidente: { select: { id: true, nombre: true } },
      conductor: { select: { id: true, nombre: true } },
      lector: { select: { id: true, nombre: true } },
      oracionInicial: { select: { id: true, nombre: true } },
      oracionFinal: { select: { id: true, nombre: true } },
    },
  });
}

/**
 * Create or update weekend meeting for a week.
 * oracionInicialId is auto-set to presidenteId (PRD: "la da el presidente").
 */
export async function upsertWeekendMeeting(
  weekId: string,
  data: WeekendMeetingFormData
): Promise<WeekendMeeting> {
  const oracionInicialId = data.presidenteId ?? undefined;

  return prisma.weekendMeeting.upsert({
    where: { meetingWeekId: weekId },
    create: {
      meetingWeekId: weekId,
      discursoTema: data.discursoTema ?? null,
      discursoOrador: data.discursoOrador ?? null,
      presidenteId: data.presidenteId ?? null,
      conductorId: data.conductorId ?? null,
      lectorId: data.lectorId ?? null,
      oracionInicialId: oracionInicialId ?? null,
      oracionFinalId: data.oracionFinalId ?? null,
    },
    update: {
      ...(data.discursoTema !== undefined && {
        discursoTema: data.discursoTema ?? null,
      }),
      ...(data.discursoOrador !== undefined && {
        discursoOrador: data.discursoOrador ?? null,
      }),
      ...(data.presidenteId !== undefined && {
        presidenteId: data.presidenteId ?? null,
        oracionInicialId: data.presidenteId ?? null,
      }),
      ...(data.conductorId !== undefined && {
        conductorId: data.conductorId ?? null,
      }),
      ...(data.lectorId !== undefined && {
        lectorId: data.lectorId ?? null,
      }),
      ...(data.oracionFinalId !== undefined && {
        oracionFinalId: data.oracionFinalId ?? null,
      }),
    },
  });
}

/**
 * Get eligible publishers for weekend presidente.
 * Elder with habilitadoVMC=true.
 */
export async function getWeekendPresidenteCandidates(): Promise<
  WeekendCandidate[]
> {
  return prisma.publisher.findMany({
    where: {
      sexo: Gender.MALE,
      rol: Role.ELDER,
      estado: PublisherStatus.ACTIVE,
      habilitadoVMC: true,
      deletedAt: null,
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
}

/**
 * Get eligible publishers for weekend lector Atalaya.
 * Publishers with habilitadoLectura=true and habilitadoVMC=true.
 */
export async function getWeekendLectorCandidates(): Promise<
  WeekendCandidate[]
> {
  return prisma.publisher.findMany({
    where: {
      habilitadoLectura: true,
      estado: PublisherStatus.ACTIVE,
      habilitadoVMC: true,
      deletedAt: null,
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
}

/**
 * Get eligible publishers for weekend oración final.
 * Male baptized (Elder/Ministerial/BaptizedPublisher) with habilitadoVMC=true.
 */
export async function getWeekendBaptizedMaleCandidates(): Promise<
  WeekendCandidate[]
> {
  return prisma.publisher.findMany({
    where: {
      sexo: Gender.MALE,
      rol: {
        in: [Role.ELDER, Role.MINISTERIAL_SERVANT, Role.BAPTIZED_PUBLISHER],
      },
      estado: PublisherStatus.ACTIVE,
      habilitadoVMC: true,
      deletedAt: null,
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
}

/**
 * Get eligible publishers for weekend conductor (Watchtower study conductor).
 * Publishers with habilitadoConductorAtalaya=true, active, not deleted.
 */
export async function getWeekendConductorCandidates(): Promise<
  WeekendCandidate[]
> {
  return prisma.publisher.findMany({
    where: {
      habilitadoConductorAtalaya: true,
      estado: PublisherStatus.ACTIVE,
      deletedAt: null,
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
}

// ─── Engine Data Functions ───────────────────────────────────────────

/**
 * Slot-to-field mapping for building rotation data from WeekendMeeting records.
 */
const WEEKEND_SLOT_FIELDS: { slot: WeekendSlot; field: string }[] = [
  { slot: 'presidente', field: 'presidenteId' },
  { slot: 'conductor', field: 'conductorId' },
  { slot: 'lector', field: 'lectorId' },
  { slot: 'oracionFinal', field: 'oracionFinalId' },
];

/**
 * Build rotation map from past WeekendMeeting records.
 * Returns Map<publisherId, Map<slotType, lastAssignmentDate>>.
 *
 * Queries all historical WeekendMeeting records joined with MeetingWeek.fechaInicio
 * to determine when each publisher was last assigned to each weekend slot.
 */
export async function getWeekendRotationData(): Promise<WeekendRotationMap> {
  const meetings = await prisma.weekendMeeting.findMany({
    select: {
      presidenteId: true,
      conductorId: true,
      lectorId: true,
      oracionFinalId: true,
      meetingWeek: {
        select: { fechaInicio: true },
      },
    },
    orderBy: {
      meetingWeek: { fechaInicio: 'desc' },
    },
  });

  const rotationMap: WeekendRotationMap = new Map();

  for (const meeting of meetings) {
    const fecha = meeting.meetingWeek.fechaInicio;

    for (const { slot, field } of WEEKEND_SLOT_FIELDS) {
      const publisherId = meeting[field as keyof typeof meeting] as
        | string
        | null;
      if (!publisherId) continue;

      if (!rotationMap.has(publisherId)) {
        rotationMap.set(publisherId, new Map());
      }

      const publisherMap = rotationMap.get(publisherId)!;

      // Keep only the most recent date for each slot
      const existing = publisherMap.get(slot);
      if (!existing || fecha > existing) {
        publisherMap.set(slot, fecha);
      }
    }
  }

  return rotationMap;
}

/**
 * Get all active publishers with the fields needed by the weekend engine.
 * Returns WeekendCandidate[] (from weekend-engine.ts types).
 */
export async function getWeekendEngineCandidates(): Promise<EngineCandidate[]> {
  const publishers = await prisma.publisher.findMany({
    where: {
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
      habilitadoOracion: true,
      habilitadoLectura: true,
      habilitadoPresidenciaFinDeSemana: true,
      habilitadoConductorAtalaya: true,
      skipAssignment: true,
    },
    orderBy: { nombre: 'asc' },
  });

  return publishers as EngineCandidate[];
}
