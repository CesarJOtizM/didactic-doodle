import { prisma } from '@/data/prisma';
import type { AssignmentHistory } from '@/generated/prisma/client';
import { Prisma, PublisherStatus } from '@/generated/prisma/client';
import type { PartType, Section } from '@/generated/prisma/enums';
import type { WorkloadEntry } from '@/data/publishers';

// ─── Types ───────────────────────────────────────────────────────────

export type GlobalHistoryFilters = {
  search?: string;
  tipo?: PartType;
  seccion?: Section;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
};

export type GlobalHistoryResult = {
  data: AssignmentHistory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type LastAssignmentEntry = {
  publisherId: string;
  publisherNombre: string;
  lastDate: Date | null;
  lastTipo: string | null;
  lastSeccion: string | null;
};

// ─── Repository Functions ────────────────────────────────────────────

/**
 * Get global assignment history with filtering and pagination.
 * Searches across ALL publishers (unlike per-publisher history).
 */
export async function getGlobalHistory(
  filters: GlobalHistoryFilters = {}
): Promise<GlobalHistoryResult> {
  const {
    search,
    tipo,
    seccion,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  } = filters;

  const where: Prisma.AssignmentHistoryWhereInput = {};

  if (search) {
    where.OR = [
      { publisherNombre: { contains: search } },
      { helperNombre: { contains: search } },
    ];
  }

  if (tipo !== undefined) where.tipo = tipo;
  if (seccion !== undefined) where.seccion = seccion;

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
 * Get assignment distribution across ALL active VMC-enabled publishers.
 * Returns a matrix of publishers x PartType counts for the given period.
 * Same shape as getWorkloadOverview() but callable from history module.
 */
export async function getGlobalDistribution(
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
 * Get the last assignment for each active VMC-enabled publisher.
 * Returns entries sorted by lastDate ASC (longest without assignment first).
 */
export async function getLastAssignments(): Promise<LastAssignmentEntry[]> {
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

  // Get the most recent assignment for each publisher
  const lastAssignments = await prisma.assignmentHistory.findMany({
    where: {
      publisherId: { in: publisherIds },
    },
    orderBy: { fecha: 'desc' },
    distinct: ['publisherId'],
    select: {
      publisherId: true,
      fecha: true,
      tipo: true,
      seccion: true,
    },
  });

  const lastMap = new Map(
    lastAssignments.map((a) => [
      a.publisherId,
      { lastDate: a.fecha, lastTipo: a.tipo, lastSeccion: a.seccion },
    ])
  );

  // Build entries
  const entries: LastAssignmentEntry[] = publishers.map((p) => {
    const last = lastMap.get(p.id);
    return {
      publisherId: p.id,
      publisherNombre: p.nombre,
      lastDate: last?.lastDate ?? null,
      lastTipo: last?.lastTipo ?? null,
      lastSeccion: last?.lastSeccion ?? null,
    };
  });

  // Sort: null dates first (never assigned), then oldest first
  entries.sort((a, b) => {
    if (!a.lastDate && !b.lastDate)
      return a.publisherNombre.localeCompare(b.publisherNombre);
    if (!a.lastDate) return -1;
    if (!b.lastDate) return 1;
    return a.lastDate.getTime() - b.lastDate.getTime();
  });

  return entries;
}
