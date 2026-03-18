import { prisma } from '@/data/prisma';
import type { Publisher, AssignmentHistory } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';
import { PublisherStatus, type PartType } from '@/generated/prisma/enums';
import type { PublisherFilters } from '@/lib/schemas/publisher';
import { isBaptized } from '@/lib/publisher-utils';

// ─── Types ───────────────────────────────────────────────────────────

export type PublisherWithMeta = Publisher & {
  bautizado: boolean;
  _count?: { assignmentsAsTitular: number };
};

export type PublisherListResult = {
  data: PublisherWithMeta[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PublisherHistoryFilters = {
  tipo?: PartType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
};

export type PublisherHistoryResult = {
  data: AssignmentHistory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type WorkloadEntry = {
  publisherId: string;
  publisherNombre: string;
  counts: Partial<Record<PartType, number>>;
  total: number;
};

// ─── Valid Status Transitions ────────────────────────────────────────

const VALID_TRANSITIONS: Record<PublisherStatus, PublisherStatus[]> = {
  [PublisherStatus.ACTIVE]: [
    PublisherStatus.ABSENT,
    PublisherStatus.RESTRICTED,
    PublisherStatus.INACTIVE,
  ],
  [PublisherStatus.ABSENT]: [PublisherStatus.ACTIVE],
  [PublisherStatus.RESTRICTED]: [PublisherStatus.ACTIVE],
  [PublisherStatus.INACTIVE]: [PublisherStatus.ACTIVE],
};

// ─── Repository Functions ────────────────────────────────────────────

/**
 * List publishers with filtering, search, sorting, and pagination.
 * Excludes INACTIVE by default unless explicitly filtered.
 */
export async function getPublishers(
  filters: PublisherFilters
): Promise<PublisherListResult> {
  const {
    search,
    sexo,
    rol,
    estado,
    habilitadoVMC,
    habilitadoOracion,
    habilitadoLectura,
    habilitadoAcomodador,
    habilitadoMicrofono,
    sortBy = 'nombre',
    sortOrder = 'asc',
    page = 1,
    pageSize = 20,
  } = filters;

  // Build where clause
  const where: Prisma.PublisherWhereInput = {};

  // Exclude INACTIVE by default unless explicitly filtering by status
  if (estado !== undefined) {
    where.estado = estado;
  } else {
    where.estado = { not: PublisherStatus.INACTIVE };
  }

  if (search) {
    // SQLite with better-sqlite3 — LIKE is case-insensitive for ASCII by default
    where.nombre = { contains: search };
  }
  if (sexo !== undefined) where.sexo = sexo;
  if (rol !== undefined) where.rol = rol;
  if (habilitadoVMC !== undefined) where.habilitadoVMC = habilitadoVMC;
  if (habilitadoOracion !== undefined)
    where.habilitadoOracion = habilitadoOracion;
  if (habilitadoLectura !== undefined)
    where.habilitadoLectura = habilitadoLectura;
  if (habilitadoAcomodador !== undefined)
    where.habilitadoAcomodador = habilitadoAcomodador;
  if (habilitadoMicrofono !== undefined)
    where.habilitadoMicrofono = habilitadoMicrofono;

  // Build orderBy
  let orderBy:
    | Prisma.PublisherOrderByWithRelationInput
    | Prisma.PublisherOrderByWithRelationInput[];

  switch (sortBy) {
    case 'totalAsignaciones':
      orderBy = {
        assignmentsAsTitular: { _count: sortOrder },
      };
      break;
    case 'ultimaAsignacion':
      // For "last assignment" sort, we'll use a raw approach
      // Prisma doesn't support ordering by a subquery on a different model easily
      // We'll default to nombre and handle this via raw query if needed
      // For now: sort by nombre as fallback, then refine if needed
      orderBy = { nombre: sortOrder };
      break;
    case 'nombre':
    default:
      orderBy = { nombre: sortOrder };
      break;
  }

  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.publisher.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { assignmentsAsTitular: true },
        },
      },
    }),
    prisma.publisher.count({ where }),
  ]);

  // If sorting by ultimaAsignacion, we need to fetch last assignment dates
  // and sort in memory (for the current page — acceptable for <1000 records)
  if (sortBy === 'ultimaAsignacion') {
    const publisherIds = data.map((p) => p.id);
    const lastAssignments = await prisma.assignmentHistory.groupBy({
      by: ['publisherId'],
      where: { publisherId: { in: publisherIds } },
      _max: { fecha: true },
    });

    const lastDateMap = new Map(
      lastAssignments.map((a) => [a.publisherId, a._max.fecha])
    );

    data.sort((a, b) => {
      const dateA = lastDateMap.get(a.id)?.getTime() ?? 0;
      const dateB = lastDateMap.get(b.id)?.getTime() ?? 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  const enriched: PublisherWithMeta[] = data.map((p) => ({
    ...p,
    bautizado: isBaptized(p.rol),
  }));

  return {
    data: enriched,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single publisher by ID.
 * Triggers auto-reactivation if ABSENT with expired fechaFinAusencia.
 */
export async function getPublisherById(
  id: string
): Promise<PublisherWithMeta | null> {
  const publisher = await prisma.publisher.findUnique({
    where: { id },
    include: {
      _count: {
        select: { assignmentsAsTitular: true },
      },
    },
  });

  if (!publisher) return null;

  // Auto-reactivation check
  if (
    publisher.estado === PublisherStatus.ABSENT &&
    publisher.fechaFinAusencia &&
    publisher.fechaFinAusencia <= new Date()
  ) {
    const updated = await prisma.publisher.update({
      where: { id },
      data: {
        estado: PublisherStatus.ACTIVE,
        fechaFinAusencia: null,
      },
      include: {
        _count: {
          select: { assignmentsAsTitular: true },
        },
      },
    });
    return { ...updated, bautizado: isBaptized(updated.rol) };
  }

  return { ...publisher, bautizado: isBaptized(publisher.rol) };
}

/**
 * Create a new publisher.
 */
export async function createPublisher(data: {
  nombre: string;
  sexo: string;
  rol: string;
  estado?: string;
  fechaFinAusencia?: Date | null;
  habilitadoVMC?: boolean;
  habilitadoOracion?: boolean;
  habilitadoLectura?: boolean;
  habilitadoAcomodador?: boolean;
  habilitadoMicrofono?: boolean;
  habilitadoPresidenciaFinDeSemana?: boolean;
  habilitadoConductorAtalaya?: boolean;
  skipAssignment?: boolean;
  observaciones?: string | null;
}): Promise<Publisher> {
  return prisma.publisher.create({
    data: {
      nombre: data.nombre.trim(),
      sexo: data.sexo as Prisma.PublisherCreateInput['sexo'],
      rol: data.rol as Prisma.PublisherCreateInput['rol'],
      estado:
        (data.estado as Prisma.PublisherCreateInput['estado']) ??
        PublisherStatus.ACTIVE,
      fechaFinAusencia: data.fechaFinAusencia ?? null,
      habilitadoVMC: data.habilitadoVMC ?? true,
      habilitadoOracion: data.habilitadoOracion ?? false,
      habilitadoLectura: data.habilitadoLectura ?? false,
      habilitadoAcomodador: data.habilitadoAcomodador ?? false,
      habilitadoMicrofono: data.habilitadoMicrofono ?? false,
      habilitadoPresidenciaFinDeSemana:
        data.habilitadoPresidenciaFinDeSemana ?? false,
      habilitadoConductorAtalaya: data.habilitadoConductorAtalaya ?? false,
      skipAssignment: data.skipAssignment ?? false,
      observaciones: data.observaciones ?? null,
    },
  });
}

/**
 * Update an existing publisher.
 */
export async function updatePublisher(
  id: string,
  data: {
    nombre?: string;
    sexo?: string;
    rol?: string;
    estado?: string;
    fechaFinAusencia?: Date | null;
    habilitadoVMC?: boolean;
    habilitadoOracion?: boolean;
    habilitadoLectura?: boolean;
    habilitadoAcomodador?: boolean;
    habilitadoMicrofono?: boolean;
    habilitadoPresidenciaFinDeSemana?: boolean;
    habilitadoConductorAtalaya?: boolean;
    skipAssignment?: boolean;
    observaciones?: string | null;
  }
): Promise<Publisher> {
  const updateData: Prisma.PublisherUpdateInput = {};

  if (data.nombre !== undefined) updateData.nombre = data.nombre.trim();
  if (data.sexo !== undefined)
    updateData.sexo = data.sexo as Prisma.PublisherUpdateInput['sexo'];
  if (data.rol !== undefined)
    updateData.rol = data.rol as Prisma.PublisherUpdateInput['rol'];
  if (data.estado !== undefined)
    updateData.estado = data.estado as Prisma.PublisherUpdateInput['estado'];
  if (data.fechaFinAusencia !== undefined)
    updateData.fechaFinAusencia = data.fechaFinAusencia;
  if (data.habilitadoVMC !== undefined)
    updateData.habilitadoVMC = data.habilitadoVMC;
  if (data.habilitadoOracion !== undefined)
    updateData.habilitadoOracion = data.habilitadoOracion;
  if (data.habilitadoLectura !== undefined)
    updateData.habilitadoLectura = data.habilitadoLectura;
  if (data.habilitadoAcomodador !== undefined)
    updateData.habilitadoAcomodador = data.habilitadoAcomodador;
  if (data.habilitadoMicrofono !== undefined)
    updateData.habilitadoMicrofono = data.habilitadoMicrofono;
  if (data.habilitadoPresidenciaFinDeSemana !== undefined)
    updateData.habilitadoPresidenciaFinDeSemana =
      data.habilitadoPresidenciaFinDeSemana;
  if (data.habilitadoConductorAtalaya !== undefined)
    updateData.habilitadoConductorAtalaya = data.habilitadoConductorAtalaya;
  if (data.skipAssignment !== undefined)
    updateData.skipAssignment = data.skipAssignment;
  if (data.observaciones !== undefined)
    updateData.observaciones = data.observaciones;

  return prisma.publisher.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Soft-delete a publisher: set estado=INACTIVE and deletedAt=now().
 * Only ACTIVE publishers can be soft-deleted.
 */
export async function softDeletePublisher(id: string): Promise<Publisher> {
  const publisher = await prisma.publisher.findUnique({ where: { id } });
  if (!publisher) throw new Error('Publisher not found');

  if (publisher.estado !== PublisherStatus.ACTIVE) {
    throw new Error(
      `Cannot delete publisher with status ${publisher.estado}. Only ACTIVE publishers can be deleted.`
    );
  }

  return prisma.publisher.update({
    where: { id },
    data: {
      estado: PublisherStatus.INACTIVE,
      deletedAt: new Date(),
    },
  });
}

/**
 * Reactivate an INACTIVE publisher: set estado=ACTIVE, clear deletedAt.
 */
export async function reactivatePublisher(id: string): Promise<Publisher> {
  const publisher = await prisma.publisher.findUnique({ where: { id } });
  if (!publisher) throw new Error('Publisher not found');

  if (publisher.estado !== PublisherStatus.INACTIVE) {
    throw new Error(
      `Cannot reactivate publisher with status ${publisher.estado}. Only INACTIVE publishers can be reactivated.`
    );
  }

  return prisma.publisher.update({
    where: { id },
    data: {
      estado: PublisherStatus.ACTIVE,
      deletedAt: null,
    },
  });
}

/**
 * Change publisher status with transition validation.
 */
export async function changePublisherStatus(
  id: string,
  newStatus: PublisherStatus,
  fechaFinAusencia?: Date | null
): Promise<Publisher> {
  const publisher = await prisma.publisher.findUnique({ where: { id } });
  if (!publisher) throw new Error('Publisher not found');

  const allowedTransitions = VALID_TRANSITIONS[publisher.estado];
  if (!allowedTransitions?.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${publisher.estado} to ${newStatus}`
    );
  }

  const updateData: Prisma.PublisherUpdateInput = {
    estado: newStatus,
  };

  // Handle fechaFinAusencia for ABSENT status
  if (newStatus === PublisherStatus.ABSENT) {
    updateData.fechaFinAusencia = fechaFinAusencia ?? null;
  } else {
    updateData.fechaFinAusencia = null;
  }

  // Handle INACTIVE (soft-delete via status change)
  if (newStatus === PublisherStatus.INACTIVE) {
    updateData.deletedAt = new Date();
  }

  // Handle reactivation from INACTIVE
  if (
    publisher.estado === PublisherStatus.INACTIVE &&
    newStatus === PublisherStatus.ACTIVE
  ) {
    updateData.deletedAt = null;
  }

  return prisma.publisher.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Get assignment history for a publisher with filtering and pagination.
 */
export async function getPublisherHistory(
  publisherId: string,
  filters: PublisherHistoryFilters = {}
): Promise<PublisherHistoryResult> {
  const { tipo, dateFrom, dateTo, page = 1, pageSize = 20 } = filters;

  const where: Prisma.AssignmentHistoryWhereInput = {
    publisherId,
  };

  if (tipo !== undefined) where.tipo = tipo;
  if (dateFrom || dateTo) {
    where.fecha = {};
    if (dateFrom) where.fecha.gte = dateFrom;
    if (dateTo) where.fecha.lte = dateTo;
  }

  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.assignmentHistory.findMany({
      where,
      orderBy: { fecha: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.assignmentHistory.count({ where }),
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
 * Get assignment workload for a publisher over the last N months.
 * Returns assignment counts grouped by PartType.
 */
export async function getPublisherWorkload(
  publisherId: string,
  months: number = 3
): Promise<Partial<Record<PartType, number>>> {
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months);

  const groups = await prisma.assignmentHistory.groupBy({
    by: ['tipo'],
    where: {
      publisherId,
      fecha: { gte: dateFrom },
    },
    _count: true,
  });

  const counts: Partial<Record<PartType, number>> = {};
  for (const group of groups) {
    counts[group.tipo] = group._count;
  }

  return counts;
}

/**
 * Get workload overview for all active VMC-enabled publishers.
 * Returns a matrix of publishers x PartType assignment counts.
 */
export async function getWorkloadOverview(
  months: number = 3
): Promise<WorkloadEntry[]> {
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months);

  // Get all active VMC-enabled publishers
  const publishers = await prisma.publisher.findMany({
    where: {
      estado: PublisherStatus.ACTIVE,
      habilitadoVMC: true,
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });

  if (publishers.length === 0) return [];

  const publisherIds = publishers.map((p) => p.id);

  // Get assignment counts grouped by publisher and type
  const groups = await prisma.assignmentHistory.groupBy({
    by: ['publisherId', 'tipo'],
    where: {
      publisherId: { in: publisherIds },
      fecha: { gte: dateFrom },
    },
    _count: true,
  });

  // Build lookup map
  const countMap = new Map<string, Partial<Record<PartType, number>>>();
  for (const group of groups) {
    if (!countMap.has(group.publisherId)) {
      countMap.set(group.publisherId, {});
    }
    countMap.get(group.publisherId)![group.tipo] = group._count;
  }

  // Build entries
  return publishers.map((p) => {
    const counts = countMap.get(p.id) ?? {};
    const total = Object.values(counts).reduce((sum, c) => sum + (c ?? 0), 0);
    return {
      publisherId: p.id,
      publisherNombre: p.nombre,
      counts,
      total,
    };
  });
}

/**
 * Check and auto-reactivate ABSENT publishers whose fechaFinAusencia has passed.
 * Called on list page load (design decision D6: on-access check).
 */
export async function checkAndReactivateAbsentPublishers(): Promise<number> {
  const result = await prisma.publisher.updateMany({
    where: {
      estado: PublisherStatus.ABSENT,
      fechaFinAusencia: {
        not: null,
        lte: new Date(),
      },
    },
    data: {
      estado: PublisherStatus.ACTIVE,
      fechaFinAusencia: null,
    },
  });

  return result.count;
}
