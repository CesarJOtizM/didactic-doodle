import { prisma } from '@/data/prisma';
import { PublisherStatus, Gender, Role } from '@/generated/prisma/enums';
import type { WeekendMeeting } from '@/generated/prisma/client';

// ─── Types ───────────────────────────────────────────────────────────

export type WeekendMeetingWithPublishers = WeekendMeeting & {
  presidente: { id: string; nombre: string } | null;
  lector: { id: string; nombre: string } | null;
  oracionInicial: { id: string; nombre: string } | null;
  oracionFinal: { id: string; nombre: string } | null;
};

export type WeekendMeetingFormData = {
  discursoTema?: string;
  discursoOrador?: string;
  presidenteId?: string | null;
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
