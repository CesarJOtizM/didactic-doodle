import { prisma } from '@/data/prisma';
import type {
  MigrationReport,
  PublisherMatch,
  MatchResult,
  ExcelInscrito,
  ExcelHistorico,
  ExcelVariable,
} from '@/lib/migration/types';
import { Section, PartType, Room, WeekStatus } from '@/generated/prisma/enums';

// ─── Constants ───────────────────────────────────────────────────────

const BATCH_SIZE = 500;

// ─── Publisher Matching ──────────────────────────────────────────────

/**
 * Match Excel publisher names against existing publishers (case-insensitive, trimmed).
 * Returns match results with status for each Excel name.
 */
export async function matchPublishersByName(
  inscritos: ExcelInscrito[]
): Promise<MatchResult> {
  const publishers = await prisma.publisher.findMany({
    select: { id: true, nombre: true },
  });

  // Build a normalized name → publisher lookup
  const normalizedMap = new Map<string, { id: string; nombre: string }>();
  for (const pub of publishers) {
    normalizedMap.set(pub.nombre.trim().toLowerCase(), pub);
  }

  const matches: PublisherMatch[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const inscrito of inscritos) {
    const normalized = inscrito.nombre.trim().toLowerCase();
    const found = normalizedMap.get(normalized);

    if (found) {
      matches.push({
        excelName: inscrito.nombre,
        publisherId: found.id,
        publisherName: found.nombre,
        status: 'matched',
      });
      matchedCount++;
    } else {
      matches.push({
        excelName: inscrito.nombre,
        publisherId: null,
        publisherName: null,
        status: 'unmatched',
      });
      unmatchedCount++;
    }
  }

  return { matches, matchedCount, unmatchedCount };
}

// ─── Import Publisher Flags ──────────────────────────────────────────

/**
 * Update matched publishers with flags from Excel.
 * Only updates habilitadoVMC from the "Aprobado" column.
 * Idempotent: running multiple times produces the same result.
 */
export async function importPublisherFlags(
  inscritos: ExcelInscrito[],
  matches: PublisherMatch[]
): Promise<MigrationReport> {
  const report: MigrationReport = {
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Build name → inscrito lookup
  const inscritoMap = new Map<string, ExcelInscrito>();
  for (const ins of inscritos) {
    inscritoMap.set(ins.nombre.trim().toLowerCase(), ins);
  }

  const matchedEntries = matches.filter(
    (m) => m.status === 'matched' && m.publisherId
  );

  for (const match of matchedEntries) {
    const inscrito = inscritoMap.get(match.excelName.trim().toLowerCase());
    if (!inscrito || !match.publisherId) {
      report.skipped++;
      continue;
    }

    try {
      await prisma.publisher.update({
        where: { id: match.publisherId },
        data: {
          habilitadoVMC: inscrito.habilitadoVMC ?? true,
        },
      });
      report.imported++;
    } catch (err) {
      report.failed++;
      report.errors.push(
        `Failed to update ${match.excelName}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return report;
}

// ─── Import Assignment History ───────────────────────────────────────

/**
 * Import assignment history from Excel into AssignmentHistory.
 * Idempotent: uses natural key (fecha+publisherId+seccion+tipo+titulo+sala) to skip duplicates.
 * Processes in batches of BATCH_SIZE within transactions.
 */
export async function importAssignmentHistory(
  historico: ExcelHistorico[]
): Promise<MigrationReport> {
  const report: MigrationReport = {
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Build publisher name → id lookup
  const publishers = await prisma.publisher.findMany({
    select: { id: true, nombre: true },
  });
  const publisherMap = new Map<string, { id: string; nombre: string }>();
  for (const pub of publishers) {
    publisherMap.set(pub.nombre.trim().toLowerCase(), pub);
  }

  // Filter out rows with no titular name
  const validRows = historico.filter((h) => h.nombreTitular.trim().length > 0);

  // Process in batches
  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        try {
          const titular = publisherMap.get(
            row.nombreTitular.trim().toLowerCase()
          );
          if (!titular) {
            report.skipped++;
            continue;
          }

          const fecha = new Date(row.fecha);
          const seccion = row.seccion as Section;
          const tipo = row.tipo as PartType;
          const sala = row.sala as Room;

          // Check for existing record (idempotency)
          const existing = await tx.assignmentHistory.findFirst({
            where: {
              fecha,
              publisherId: titular.id,
              seccion,
              tipo,
              titulo: row.titulo,
              sala,
            },
          });

          if (existing) {
            report.skipped++;
            continue;
          }

          // Resolve helper if present
          let helperId: string | null = null;
          let helperNombre: string | null = null;
          if (row.nombreAyudante) {
            const helper = publisherMap.get(
              row.nombreAyudante.trim().toLowerCase()
            );
            if (helper) {
              helperId = helper.id;
              helperNombre = helper.nombre;
            }
          }

          // Derive week label from fecha
          const semana = formatWeekLabel(fecha);

          await tx.assignmentHistory.create({
            data: {
              fecha,
              semana,
              seccion,
              tipo,
              titulo: row.titulo,
              sala,
              publisherId: titular.id,
              publisherNombre: titular.nombre,
              helperId,
              helperNombre,
            },
          });
          report.imported++;
        } catch (err) {
          report.failed++;
          report.errors.push(
            `Row ${row.fecha} ${row.nombreTitular}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    });
  }

  return report;
}

// ─── Import Weekly Schemas ───────────────────────────────────────────

/**
 * Import weekly schemas from Excel into MeetingWeek + MeetingPart.
 * Idempotent: skips weeks that already exist (by fechaInicio).
 */
export async function importWeeklySchemas(
  variables: ExcelVariable[]
): Promise<MigrationReport> {
  const report: MigrationReport = {
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const variable of variables) {
    try {
      const fechaInicio = new Date(variable.fecha);

      // Check if week already exists (idempotency)
      const existing = await prisma.meetingWeek.findUnique({
        where: { fechaInicio },
      });

      if (existing) {
        report.skipped++;
        continue;
      }

      // Calculate fechaFin (Sunday of the same week)
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 6);

      await prisma.$transaction(async (tx) => {
        // Create the week
        const week = await tx.meetingWeek.create({
          data: {
            fechaInicio,
            fechaFin,
            lecturaSemanal: variable.lecturaSemanal || '',
            cancionApertura: variable.cancionApertura,
            cancionIntermedia: variable.cancionIntermedia,
            cancionCierre: variable.cancionCierre,
            salaAuxiliarActiva: variable.salaAuxiliarActiva,
            estado: WeekStatus.DRAFT,
          },
        });

        // Create parts
        for (const parte of variable.partes) {
          await tx.meetingPart.create({
            data: {
              meetingWeekId: week.id,
              seccion: parte.seccion as Section,
              tipo: parte.tipo as PartType,
              titulo: parte.titulo,
              orden: parte.orden,
              duracion: parte.duracion,
              sala: parte.sala as Room,
              requiereAyudante: parte.requiereAyudante,
            },
          });
        }
      });

      report.imported++;
    } catch (err) {
      report.failed++;
      report.errors.push(
        `Week ${variable.fecha}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return report;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}
