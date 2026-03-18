import { prisma } from '@/data/prisma';
import type {
  MeetingWeek,
  MeetingPart,
  Assignment,
  WeekendMeeting,
} from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';
import { WeekStatus, Section, PartType, Room } from '@/generated/prisma/enums';
import { FIXED_PARTS_TEMPLATE } from '@/lib/constants/meeting-parts';
import { getWeekEnd } from '@/lib/meeting-week-utils';
import type { SMMPartInput, NVCPartInput } from '@/lib/schemas/meeting-week';

// ─── Types ───────────────────────────────────────────────────────────

export type MeetingWeekWithParts = MeetingWeek & {
  parts: (MeetingPart & {
    assignment:
      | (Assignment & {
          publisher: { id: string; nombre: string };
          helper: { id: string; nombre: string } | null;
        })
      | null;
  })[];
  weekendMeeting:
    | (WeekendMeeting & {
        presidente: { id: string; nombre: string } | null;
        conductor: { id: string; nombre: string } | null;
        lector: { id: string; nombre: string } | null;
        oracionInicial: { id: string; nombre: string } | null;
        oracionFinal: { id: string; nombre: string } | null;
      })
    | null;
};

export type MeetingWeekListResult = {
  data: (MeetingWeek & { _count: { parts: number } })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MeetingWeekFilters = {
  status?: WeekStatus;
  page?: number;
  pageSize?: number;
};

// ─── Valid Status Transitions ────────────────────────────────────────

const VALID_STATUS_TRANSITIONS: Record<WeekStatus, WeekStatus[]> = {
  [WeekStatus.DRAFT]: [WeekStatus.ASSIGNED],
  [WeekStatus.ASSIGNED]: [WeekStatus.PUBLISHED],
  [WeekStatus.PUBLISHED]: [WeekStatus.ASSIGNED],
};

// ─── Repository Functions ────────────────────────────────────────────

/**
 * List meeting weeks with optional status filter and pagination.
 * Sorted by fechaInicio descending.
 */
export async function getMeetingWeeks(
  filters: MeetingWeekFilters = {}
): Promise<MeetingWeekListResult> {
  const { status, page = 1, pageSize = 20 } = filters;

  const where: Prisma.MeetingWeekWhereInput = {};
  if (status !== undefined) {
    where.estado = status;
  }

  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.meetingWeek.findMany({
      where,
      orderBy: { fechaInicio: 'desc' },
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { parts: true },
        },
      },
    }),
    prisma.meetingWeek.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single meeting week by ID with all parts eagerly loaded.
 * Parts are ordered by seccion then orden.
 */
export async function getMeetingWeekById(
  id: string
): Promise<MeetingWeekWithParts | null> {
  const week = await prisma.meetingWeek.findUnique({
    where: { id },
    include: {
      parts: {
        orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
        include: {
          assignment: {
            include: {
              publisher: { select: { id: true, nombre: true } },
              helper: { select: { id: true, nombre: true } },
            },
          },
        },
      },
      weekendMeeting: {
        include: {
          presidente: { select: { id: true, nombre: true } },
          conductor: { select: { id: true, nombre: true } },
          lector: { select: { id: true, nombre: true } },
          oracionInicial: { select: { id: true, nombre: true } },
          oracionFinal: { select: { id: true, nombre: true } },
        },
      },
    },
  });

  return week as MeetingWeekWithParts | null;
}

/**
 * Create a meeting week with all fixed + dynamic parts in a single transaction.
 * Validates: fechaInicio uniqueness, generates fixed parts from template,
 * creates SMM parts (+ aux copies if active), creates NVC parts.
 */
export async function createMeetingWeek(data: {
  fechaInicio: Date;
  lecturaSemanal: string;
  cancionApertura: number;
  cancionIntermedia: number;
  cancionCierre: number;
  salaAuxiliarActiva: boolean;
  smmParts: SMMPartInput[];
  nvcParts: NVCPartInput[];
}): Promise<MeetingWeek> {
  // Check uniqueness before transaction
  const existing = await prisma.meetingWeek.findUnique({
    where: { fechaInicio: data.fechaInicio },
  });
  if (existing) {
    throw new Error('A week with that start date already exists');
  }

  const fechaFin = getWeekEnd(data.fechaInicio);

  return prisma.$transaction(async (tx) => {
    // 1. Create the week
    const week = await tx.meetingWeek.create({
      data: {
        fechaInicio: data.fechaInicio,
        fechaFin,
        lecturaSemanal: data.lecturaSemanal.trim(),
        cancionApertura: data.cancionApertura,
        cancionIntermedia: data.cancionIntermedia,
        cancionCierre: data.cancionCierre,
        salaAuxiliarActiva: data.salaAuxiliarActiva,
        estado: WeekStatus.DRAFT,
      },
    });

    // 2. Insert fixed parts from template (filter by onlyIfAuxiliary)
    const fixedParts = FIXED_PARTS_TEMPLATE.filter(
      (t) => !t.onlyIfAuxiliary || data.salaAuxiliarActiva
    );

    for (const template of fixedParts) {
      await tx.meetingPart.create({
        data: {
          meetingWeekId: week.id,
          seccion: template.seccion,
          tipo: template.tipo,
          titulo: template.tituloKey,
          orden: template.orden,
          duracion: template.duracion,
          sala: template.sala,
          requiereAyudante: template.requiereAyudante,
        },
      });
    }

    // 3. Insert SMM dynamic parts (MINISTRY_SCHOOL section)
    // Order starts at 2 (after Encargado at orden=1)
    for (let i = 0; i < data.smmParts.length; i++) {
      const smm = data.smmParts[i];
      const orden = i + 2; // Encargado is at 1

      // Main room part
      await tx.meetingPart.create({
        data: {
          meetingWeekId: week.id,
          seccion: Section.MINISTRY_SCHOOL,
          tipo: smm.tipo as PartType,
          titulo: smm.titulo.trim(),
          orden,
          duracion: smm.duracion,
          sala: Room.MAIN,
          requiereAyudante: smm.requiereAyudante,
        },
      });

      // Auxiliary copy if active
      if (data.salaAuxiliarActiva) {
        await tx.meetingPart.create({
          data: {
            meetingWeekId: week.id,
            seccion: Section.MINISTRY_SCHOOL,
            tipo: smm.tipo as PartType,
            titulo: smm.titulo.trim(),
            orden,
            duracion: smm.duracion,
            sala: Room.AUXILIARY_1,
            requiereAyudante: smm.requiereAyudante,
          },
        });
      }
    }

    // 4. Insert NVC dynamic parts (CHRISTIAN_LIFE section)
    // Order: 1-based, before the fixed Study parts (which are at 100-101)
    for (let i = 0; i < data.nvcParts.length; i++) {
      const nvc = data.nvcParts[i];
      const orden = i + 1;

      await tx.meetingPart.create({
        data: {
          meetingWeekId: week.id,
          seccion: Section.CHRISTIAN_LIFE,
          tipo: PartType.SPEECH,
          titulo: nvc.titulo.trim(),
          orden,
          duracion: nvc.duracion,
          sala: Room.MAIN,
          requiereAyudante: false,
        },
      });
    }

    return week;
  });
}

/**
 * Update meeting week scalar fields.
 * If salaAuxiliarActiva is toggled:
 *   ON  → create missing AUXILIARY_1 parts (Bible Reading + SMM copies)
 *   OFF → delete all AUXILIARY_1 parts
 */
export async function updateMeetingWeek(
  id: string,
  data: {
    lecturaSemanal?: string;
    cancionApertura?: number;
    cancionIntermedia?: number;
    cancionCierre?: number;
    salaAuxiliarActiva?: boolean;
  }
): Promise<MeetingWeek> {
  const week = await prisma.meetingWeek.findUnique({
    where: { id },
    include: { parts: true },
  });
  if (!week) throw new Error('Week not found');

  return prisma.$transaction(async (tx) => {
    // Build update payload
    const updateData: Prisma.MeetingWeekUpdateInput = {};
    if (data.lecturaSemanal !== undefined)
      updateData.lecturaSemanal = data.lecturaSemanal.trim();
    if (data.cancionApertura !== undefined)
      updateData.cancionApertura = data.cancionApertura;
    if (data.cancionIntermedia !== undefined)
      updateData.cancionIntermedia = data.cancionIntermedia;
    if (data.cancionCierre !== undefined)
      updateData.cancionCierre = data.cancionCierre;
    if (data.salaAuxiliarActiva !== undefined)
      updateData.salaAuxiliarActiva = data.salaAuxiliarActiva;

    const updated = await tx.meetingWeek.update({
      where: { id },
      data: updateData,
    });

    // Handle salaAuxiliarActiva toggle
    if (
      data.salaAuxiliarActiva !== undefined &&
      data.salaAuxiliarActiva !== week.salaAuxiliarActiva
    ) {
      if (data.salaAuxiliarActiva) {
        // Turning ON → create missing AUXILIARY_1 parts

        // 1. All auxiliary fixed parts (Bible Reading Aux, School Overseer Aux, etc.)
        const auxFixedTemplates = FIXED_PARTS_TEMPLATE.filter(
          (t) => t.onlyIfAuxiliary
        );
        for (const template of auxFixedTemplates) {
          await tx.meetingPart.create({
            data: {
              meetingWeekId: id,
              seccion: template.seccion,
              tipo: template.tipo,
              titulo: template.tituloKey,
              orden: template.orden,
              duracion: template.duracion,
              sala: template.sala,
              requiereAyudante: template.requiereAyudante,
            },
          });
        }

        // 2. SMM auxiliary copies — duplicate all existing MAIN SMM parts
        const mainSMMParts = week.parts.filter(
          (p) =>
            p.seccion === Section.MINISTRY_SCHOOL &&
            p.sala === Room.MAIN &&
            p.orden > 1 // Exclude Encargado (orden=1)
        );

        for (const mainPart of mainSMMParts) {
          await tx.meetingPart.create({
            data: {
              meetingWeekId: id,
              seccion: mainPart.seccion,
              tipo: mainPart.tipo,
              titulo: mainPart.titulo,
              orden: mainPart.orden,
              duracion: mainPart.duracion,
              sala: Room.AUXILIARY_1,
              requiereAyudante: mainPart.requiereAyudante,
            },
          });
        }
      } else {
        // Turning OFF → delete all AUXILIARY_1 parts
        await tx.meetingPart.deleteMany({
          where: {
            meetingWeekId: id,
            sala: Room.AUXILIARY_1,
          },
        });
      }
    }

    return updated;
  });
}

/**
 * Delete a meeting week. Only DRAFT weeks can be deleted.
 * Parts are cascade-deleted via the schema relation.
 */
export async function deleteMeetingWeek(id: string): Promise<MeetingWeek> {
  const week = await prisma.meetingWeek.findUnique({ where: { id } });
  if (!week) throw new Error('Week not found');

  if (week.estado !== WeekStatus.DRAFT) {
    throw new Error('Only Draft weeks can be deleted');
  }

  return prisma.meetingWeek.delete({ where: { id } });
}

/**
 * Change meeting week status with transition validation.
 * Valid: DRAFT→ASSIGNED, ASSIGNED→PUBLISHED, PUBLISHED→ASSIGNED
 */
export async function changeWeekStatus(
  id: string,
  newStatus: WeekStatus
): Promise<MeetingWeek> {
  const week = await prisma.meetingWeek.findUnique({ where: { id } });
  if (!week) throw new Error('Week not found');

  const allowed = VALID_STATUS_TRANSITIONS[week.estado];
  if (!allowed?.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${week.estado} to ${newStatus}`
    );
  }

  return prisma.meetingWeek.update({
    where: { id },
    data: { estado: newStatus },
  });
}

/**
 * Duplicate a meeting week to a new date range.
 * Copies all parts, resets to DRAFT, clears assignments.
 */
export async function duplicateMeetingWeek(
  sourceId: string,
  newFechaInicio: Date
): Promise<MeetingWeek> {
  // Validate new date is Monday
  if (newFechaInicio.getUTCDay() !== 1) {
    throw new Error('Start date must be a Monday');
  }

  // Check uniqueness
  const existing = await prisma.meetingWeek.findUnique({
    where: { fechaInicio: newFechaInicio },
  });
  if (existing) {
    throw new Error('A week with that start date already exists');
  }

  const source = await prisma.meetingWeek.findUnique({
    where: { id: sourceId },
    include: { parts: true },
  });
  if (!source) throw new Error('Source week not found');

  const fechaFin = getWeekEnd(newFechaInicio);

  return prisma.$transaction(async (tx) => {
    // Create new week as DRAFT
    const newWeek = await tx.meetingWeek.create({
      data: {
        fechaInicio: newFechaInicio,
        fechaFin,
        lecturaSemanal: source.lecturaSemanal,
        cancionApertura: source.cancionApertura,
        cancionIntermedia: source.cancionIntermedia,
        cancionCierre: source.cancionCierre,
        salaAuxiliarActiva: source.salaAuxiliarActiva,
        estado: WeekStatus.DRAFT,
      },
    });

    // Copy all parts (no assignments)
    for (const part of source.parts) {
      await tx.meetingPart.create({
        data: {
          meetingWeekId: newWeek.id,
          seccion: part.seccion,
          tipo: part.tipo,
          titulo: part.titulo,
          orden: part.orden,
          duracion: part.duracion,
          sala: part.sala,
          requiereAyudante: part.requiereAyudante,
        },
      });
    }

    return newWeek;
  });
}

/**
 * Get meeting weeks within a date range, with all parts and assignments.
 * Used for multi-week S-140 print view.
 * Sorted by fechaInicio ascending.
 */
export async function getMeetingWeeksByDateRange(
  from: Date,
  to: Date
): Promise<MeetingWeekWithParts[]> {
  const weeks = await prisma.meetingWeek.findMany({
    where: {
      fechaInicio: {
        gte: from,
        lte: to,
      },
    },
    orderBy: { fechaInicio: 'asc' },
    include: {
      parts: {
        orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
        include: {
          assignment: {
            include: {
              publisher: { select: { id: true, nombre: true } },
              helper: { select: { id: true, nombre: true } },
            },
          },
        },
      },
    },
  });

  return weeks as MeetingWeekWithParts[];
}

// ─── SMM Part CRUD ───────────────────────────────────────────────────

/**
 * Add a SMM part to the MINISTRY_SCHOOL section.
 * Auto-creates auxiliary copy if salaAuxiliarActiva.
 * Enforces max 7 SMM parts (excluding Encargado).
 */
export async function addSMMPart(
  weekId: string,
  data: SMMPartInput
): Promise<MeetingPart> {
  const week = await prisma.meetingWeek.findUnique({
    where: { id: weekId },
    include: { parts: true },
  });
  if (!week) throw new Error('Week not found');
  if (week.estado !== WeekStatus.DRAFT) {
    throw new Error('Can only modify parts on Draft weeks');
  }

  // Count existing SMM parts (MINISTRY_SCHOOL, MAIN, orden > 1)
  const currentSMMCount = week.parts.filter(
    (p) =>
      p.seccion === Section.MINISTRY_SCHOOL &&
      p.sala === Room.MAIN &&
      p.orden > 1
  ).length;

  if (currentSMMCount >= 7) {
    throw new Error('Maximum of 7 SMM parts reached');
  }

  // Determine next orden: max existing SMM orden + 1
  const maxSMMOrden = week.parts
    .filter(
      (p) =>
        p.seccion === Section.MINISTRY_SCHOOL &&
        p.sala === Room.MAIN &&
        p.orden > 1
    )
    .reduce((max, p) => Math.max(max, p.orden), 1);

  const orden = maxSMMOrden + 1;

  return prisma.$transaction(async (tx) => {
    // Main room part
    const mainPart = await tx.meetingPart.create({
      data: {
        meetingWeekId: weekId,
        seccion: Section.MINISTRY_SCHOOL,
        tipo: data.tipo as PartType,
        titulo: data.titulo.trim(),
        orden,
        duracion: data.duracion,
        sala: Room.MAIN,
        requiereAyudante: data.requiereAyudante,
      },
    });

    // Auxiliary copy if active
    if (week.salaAuxiliarActiva) {
      await tx.meetingPart.create({
        data: {
          meetingWeekId: weekId,
          seccion: Section.MINISTRY_SCHOOL,
          tipo: data.tipo as PartType,
          titulo: data.titulo.trim(),
          orden,
          duracion: data.duracion,
          sala: Room.AUXILIARY_1,
          requiereAyudante: data.requiereAyudante,
        },
      });
    }

    return mainPart;
  });
}

/**
 * Update an existing SMM part. Also updates the auxiliary copy if it exists.
 */
export async function updateSMMPart(
  partId: string,
  data: Partial<SMMPartInput>
): Promise<MeetingPart> {
  const part = await prisma.meetingPart.findUnique({
    where: { id: partId },
    include: { meetingWeek: true },
  });
  if (!part) throw new Error('Part not found');
  if (part.meetingWeek.estado !== WeekStatus.DRAFT) {
    throw new Error('Can only modify parts on Draft weeks');
  }

  const updateData: Prisma.MeetingPartUpdateInput = {};
  if (data.titulo !== undefined) updateData.titulo = data.titulo.trim();
  if (data.tipo !== undefined) updateData.tipo = data.tipo as PartType;
  if (data.duracion !== undefined) updateData.duracion = data.duracion;
  if (data.requiereAyudante !== undefined)
    updateData.requiereAyudante = data.requiereAyudante;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.meetingPart.update({
      where: { id: partId },
      data: updateData,
    });

    // Find and update the auxiliary copy (same week, same section, same orden, AUXILIARY_1)
    if (part.sala === Room.MAIN) {
      await tx.meetingPart.updateMany({
        where: {
          meetingWeekId: part.meetingWeekId,
          seccion: part.seccion,
          orden: part.orden,
          sala: Room.AUXILIARY_1,
        },
        data: updateData,
      });
    }

    return updated;
  });
}

/**
 * Remove a SMM part and its auxiliary copy.
 * Enforces min 3 SMM parts.
 */
export async function removeSMMPart(partId: string): Promise<void> {
  const part = await prisma.meetingPart.findUnique({
    where: { id: partId },
    include: {
      meetingWeek: {
        include: { parts: true },
      },
    },
  });
  if (!part) throw new Error('Part not found');
  if (part.meetingWeek.estado !== WeekStatus.DRAFT) {
    throw new Error('Can only modify parts on Draft weeks');
  }

  // Count existing SMM parts (MINISTRY_SCHOOL, MAIN, orden > 1)
  const currentSMMCount = part.meetingWeek.parts.filter(
    (p) =>
      p.seccion === Section.MINISTRY_SCHOOL &&
      p.sala === Room.MAIN &&
      p.orden > 1
  ).length;

  if (currentSMMCount <= 3) {
    throw new Error('Minimum of 3 SMM parts required');
  }

  await prisma.$transaction(async (tx) => {
    // Delete auxiliary copy first (same week, section, orden, AUXILIARY_1)
    await tx.meetingPart.deleteMany({
      where: {
        meetingWeekId: part.meetingWeekId,
        seccion: part.seccion,
        orden: part.orden,
        sala: Room.AUXILIARY_1,
      },
    });

    // Delete the main part
    await tx.meetingPart.delete({
      where: { id: partId },
    });
  });
}

// ─── NVC Part CRUD ───────────────────────────────────────────────────

/**
 * Add a NVC part to the CHRISTIAN_LIFE section.
 * Enforces max 6 NVC dynamic parts.
 */
export async function addNVCPart(
  weekId: string,
  data: NVCPartInput
): Promise<MeetingPart> {
  const week = await prisma.meetingWeek.findUnique({
    where: { id: weekId },
    include: { parts: true },
  });
  if (!week) throw new Error('Week not found');
  if (week.estado !== WeekStatus.DRAFT) {
    throw new Error('Can only modify parts on Draft weeks');
  }

  // Count existing NVC dynamic parts (CHRISTIAN_LIFE, MAIN, orden < 100)
  const currentNVCCount = week.parts.filter(
    (p) =>
      p.seccion === Section.CHRISTIAN_LIFE &&
      p.sala === Room.MAIN &&
      p.orden < 100
  ).length;

  if (currentNVCCount >= 6) {
    throw new Error('Maximum of 6 NVC parts reached');
  }

  // Determine next orden
  const maxNVCOrden = week.parts
    .filter(
      (p) =>
        p.seccion === Section.CHRISTIAN_LIFE &&
        p.sala === Room.MAIN &&
        p.orden < 100
    )
    .reduce((max, p) => Math.max(max, p.orden), 0);

  const orden = maxNVCOrden + 1;

  return prisma.meetingPart.create({
    data: {
      meetingWeekId: weekId,
      seccion: Section.CHRISTIAN_LIFE,
      tipo: PartType.SPEECH,
      titulo: data.titulo.trim(),
      orden,
      duracion: data.duracion,
      sala: Room.MAIN,
      requiereAyudante: false,
    },
  });
}

/**
 * Update an existing NVC part.
 */
export async function updateNVCPart(
  partId: string,
  data: Partial<NVCPartInput>
): Promise<MeetingPart> {
  const part = await prisma.meetingPart.findUnique({
    where: { id: partId },
    include: { meetingWeek: true },
  });
  if (!part) throw new Error('Part not found');
  if (part.meetingWeek.estado !== WeekStatus.DRAFT) {
    throw new Error('Can only modify parts on Draft weeks');
  }

  const updateData: Prisma.MeetingPartUpdateInput = {};
  if (data.titulo !== undefined) updateData.titulo = data.titulo.trim();
  if (data.duracion !== undefined) updateData.duracion = data.duracion;

  return prisma.meetingPart.update({
    where: { id: partId },
    data: updateData,
  });
}

/**
 * Remove a NVC part. No minimum enforced — weeks can have 0 NVC parts.
 */
export async function removeNVCPart(partId: string): Promise<void> {
  const part = await prisma.meetingPart.findUnique({
    where: { id: partId },
    include: { meetingWeek: true },
  });
  if (!part) throw new Error('Part not found');
  if (part.meetingWeek.estado !== WeekStatus.DRAFT) {
    throw new Error('Can only modify parts on Draft weeks');
  }

  await prisma.meetingPart.delete({
    where: { id: partId },
  });
}
