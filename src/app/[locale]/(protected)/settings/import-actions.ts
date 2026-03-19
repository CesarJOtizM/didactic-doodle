'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/data/prisma';
import {
  Gender,
  Role,
  PublisherStatus,
  Section,
  PartType,
  Room,
} from '@/generated/prisma/enums';

// ─── CSV Template ─────────────────────────────────────────────────────

const CSV_HEADERS = [
  'nombre',
  'sexo',
  'rol',
  'estado',
  'vmc',
  'oracion',
  'lectura',
  'acomodador',
  'microfono',
  'presidencia_fin_semana',
  'conductor_atalaya',
  'omitir_asignacion',
  'observaciones',
] as const;

const EXAMPLE_ROWS = [
  'Juan Perez,Masculino,Anciano,Activo,Si,Si,No,Si,Si,Si,No,No,Buen orador',
  'Maria Lopez,Femenino,Publicador bautizado,Activo,Si,No,No,No,No,No,No,No,',
];

export async function downloadPublishersCsvTemplateAction(): Promise<string> {
  const BOM = '\uFEFF';
  const header = CSV_HEADERS.join(',');
  return BOM + header + '\n' + EXAMPLE_ROWS.join('\n') + '\n';
}

// ─── Value Mappings ───────────────────────────────────────────────────

const GENDER_MAP: Record<string, Gender> = {
  masculino: Gender.MALE,
  male: Gender.MALE,
  hombre: Gender.MALE,
  femenino: Gender.FEMALE,
  female: Gender.FEMALE,
  mujer: Gender.FEMALE,
};

const ROLE_MAP: Record<string, Role> = {
  anciano: Role.ELDER,
  elder: Role.ELDER,
  'siervo ministerial': Role.MINISTERIAL_SERVANT,
  'ministerial servant': Role.MINISTERIAL_SERVANT,
  'publicador bautizado': Role.BAPTIZED_PUBLISHER,
  'baptized publisher': Role.BAPTIZED_PUBLISHER,
  'publicador no bautizado': Role.UNBAPTIZED_PUBLISHER,
  'unbaptized publisher': Role.UNBAPTIZED_PUBLISHER,
};

const STATUS_MAP: Record<string, PublisherStatus> = {
  activo: PublisherStatus.ACTIVE,
  active: PublisherStatus.ACTIVE,
  ausente: PublisherStatus.ABSENT,
  absent: PublisherStatus.ABSENT,
  restringido: PublisherStatus.RESTRICTED,
  restricted: PublisherStatus.RESTRICTED,
  inactivo: PublisherStatus.INACTIVE,
  inactive: PublisherStatus.INACTIVE,
};

const FEMALE_ALLOWED_ROLES: Role[] = [
  Role.BAPTIZED_PUBLISHER,
  Role.UNBAPTIZED_PUBLISHER,
];

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ['si', 'sí', 'yes', '1', 'true'].includes(normalized);
}

// ─── CSV Parser ───────────────────────────────────────────────────────

/**
 * Parse a CSV line handling quoted fields with commas inside.
 * Handles: field,"field with, comma",field
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

// ─── Types ────────────────────────────────────────────────────────────

export type ParsedPublisher = {
  nombre: string;
  sexo: Gender;
  rol: Role;
  estado: PublisherStatus;
  habilitadoVMC: boolean;
  habilitadoOracion: boolean;
  habilitadoLectura: boolean;
  habilitadoAcomodador: boolean;
  habilitadoMicrofono: boolean;
  habilitadoPresidenciaFinDeSemana: boolean;
  habilitadoConductorAtalaya: boolean;
  skipAssignment: boolean;
  observaciones: string | null;
};

export type CsvRowError = {
  row: number;
  field: string;
  message: string;
};

export type CsvParseResult = {
  valid: ParsedPublisher[];
  errors: CsvRowError[];
  duplicatesInCsv: string[];
  existingInDb: string[];
};

export type ImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};

// ─── Zod Schema for a single CSV row ─────────────────────────────────

const csvRowSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(200),
  sexo: z.enum([Gender.MALE, Gender.FEMALE] as [Gender, ...Gender[]]),
  rol: z.enum(Object.values(Role) as [Role, ...Role[]]),
  estado: z
    .enum(
      Object.values(PublisherStatus) as [PublisherStatus, ...PublisherStatus[]]
    )
    .default(PublisherStatus.ACTIVE),
  habilitadoVMC: z.boolean().default(true),
  habilitadoOracion: z.boolean().default(false),
  habilitadoLectura: z.boolean().default(false),
  habilitadoAcomodador: z.boolean().default(false),
  habilitadoMicrofono: z.boolean().default(false),
  habilitadoPresidenciaFinDeSemana: z.boolean().default(false),
  habilitadoConductorAtalaya: z.boolean().default(false),
  skipAssignment: z.boolean().default(false),
  observaciones: z.string().max(1000).nullable().optional(),
});

// ─── Parse CSV Action ─────────────────────────────────────────────────

export async function parsePublishersCsvAction(
  formData: FormData
): Promise<
  { success: true; data: CsvParseResult } | { success: false; error: string }
> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!file.name.endsWith('.csv')) {
      return { success: false, error: 'File must be a CSV file (.csv)' };
    }

    const text = await file.text();
    // Remove BOM if present
    const clean = text.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV file must have a header row and at least one data row',
      };
    }

    // Parse header
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

    // Validate required headers
    const requiredHeaders = ['nombre', 'sexo', 'rol'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
      };
    }

    // Build column index map
    const colIndex: Record<string, number> = {};
    for (let i = 0; i < headers.length; i++) {
      colIndex[headers[i]] = i;
    }

    const valid: ParsedPublisher[] = [];
    const errors: CsvRowError[] = [];
    const seenNames = new Map<string, number>(); // normalized name → first row
    const duplicatesInCsv: string[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1; // 1-indexed, accounting for header
      const fields = parseCsvLine(lines[i]);

      const getValue = (col: string): string => {
        const idx = colIndex[col];
        return idx !== undefined && idx < fields.length
          ? fields[idx].trim()
          : '';
      };

      // Map raw values to enum values
      const nombreRaw = getValue('nombre');
      const sexoRaw = getValue('sexo').toLowerCase();
      const rolRaw = getValue('rol').toLowerCase();
      const estadoRaw = getValue('estado').toLowerCase();

      // Check nombre
      if (!nombreRaw) {
        errors.push({
          row: rowNumber,
          field: 'nombre',
          message: 'Nombre es requerido',
        });
        continue;
      }

      // Check for duplicates within CSV
      const normalizedName = nombreRaw.trim().toLowerCase();
      const firstRow = seenNames.get(normalizedName);
      if (firstRow !== undefined) {
        duplicatesInCsv.push(nombreRaw);
        errors.push({
          row: rowNumber,
          field: 'nombre',
          message: `Nombre duplicado en CSV (primera aparición en fila ${firstRow})`,
        });
        continue;
      }
      seenNames.set(normalizedName, rowNumber);

      // Map sexo
      const sexo = GENDER_MAP[sexoRaw];
      if (!sexo) {
        errors.push({
          row: rowNumber,
          field: 'sexo',
          message: `Sexo inválido: "${getValue('sexo')}". Use: Masculino/Femenino`,
        });
        continue;
      }

      // Map rol
      const rol = ROLE_MAP[rolRaw];
      if (!rol) {
        errors.push({
          row: rowNumber,
          field: 'rol',
          message: `Rol inválido: "${getValue('rol')}". Use: Anciano/Siervo ministerial/Publicador bautizado/Publicador no bautizado`,
        });
        continue;
      }

      // Cross-field: female can only be publisher
      if (sexo === Gender.FEMALE && !FEMALE_ALLOWED_ROLES.includes(rol)) {
        errors.push({
          row: rowNumber,
          field: 'rol',
          message: `Las mujeres solo pueden ser Publicador bautizado o Publicador no bautizado`,
        });
        continue;
      }

      // Map estado (default to ACTIVE)
      const estado = estadoRaw ? STATUS_MAP[estadoRaw] : PublisherStatus.ACTIVE;
      if (estadoRaw && !estado) {
        errors.push({
          row: rowNumber,
          field: 'estado',
          message: `Estado inválido: "${getValue('estado')}". Use: Activo/Ausente/Restringido/Inactivo`,
        });
        continue;
      }

      // Build the parsed row
      const row = {
        nombre: nombreRaw.trim(),
        sexo,
        rol,
        estado: estado ?? PublisherStatus.ACTIVE,
        habilitadoVMC: parseBoolean(getValue('vmc')),
        habilitadoOracion: parseBoolean(getValue('oracion')),
        habilitadoLectura: parseBoolean(getValue('lectura')),
        habilitadoAcomodador: parseBoolean(getValue('acomodador')),
        habilitadoMicrofono: parseBoolean(getValue('microfono')),
        habilitadoPresidenciaFinDeSemana: parseBoolean(
          getValue('presidencia_fin_semana')
        ),
        habilitadoConductorAtalaya: parseBoolean(getValue('conductor_atalaya')),
        skipAssignment: parseBoolean(getValue('omitir_asignacion')),
        observaciones: getValue('observaciones') || null,
      };

      // Validate with Zod
      const result = csvRowSchema.safeParse(row);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            row: rowNumber,
            field: issue.path.map(String).join('.'),
            message: issue.message,
          });
        }
        continue;
      }

      valid.push(result.data as ParsedPublisher);
    }

    // Check for existing names in DB
    const existingInDb: string[] = [];
    if (valid.length > 0) {
      const existingPublishers = await prisma.publisher.findMany({
        select: { nombre: true },
      });

      const existingNamesSet = new Set(
        existingPublishers.map((p) => p.nombre.trim().toLowerCase())
      );

      for (const pub of valid) {
        if (existingNamesSet.has(pub.nombre.trim().toLowerCase())) {
          existingInDb.push(pub.nombre);
        }
      }
    }

    return {
      success: true,
      data: { valid, errors, duplicatesInCsv, existingInDb },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse CSV',
    };
  }
}

// ─── Import Action ────────────────────────────────────────────────────

export async function importPublishersAction(
  publishers: ParsedPublisher[]
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, skipped: 0, errors: [] };

  if (publishers.length === 0) {
    return result;
  }

  try {
    // Get existing publisher names for duplicate detection
    const existingPublishers = await prisma.publisher.findMany({
      select: { nombre: true },
    });
    const existingNamesSet = new Set(
      existingPublishers.map((p) => p.nombre.trim().toLowerCase())
    );

    await prisma.$transaction(async (tx) => {
      for (const pub of publishers) {
        const normalized = pub.nombre.trim().toLowerCase();

        if (existingNamesSet.has(normalized)) {
          result.skipped++;
          continue;
        }

        try {
          await tx.publisher.create({
            data: {
              nombre: pub.nombre.trim(),
              sexo: pub.sexo,
              rol: pub.rol,
              estado: pub.estado,
              habilitadoVMC: pub.habilitadoVMC,
              habilitadoOracion: pub.habilitadoOracion,
              habilitadoLectura: pub.habilitadoLectura,
              habilitadoAcomodador: pub.habilitadoAcomodador,
              habilitadoMicrofono: pub.habilitadoMicrofono,
              habilitadoPresidenciaFinDeSemana:
                pub.habilitadoPresidenciaFinDeSemana,
              habilitadoConductorAtalaya: pub.habilitadoConductorAtalaya,
              skipAssignment: pub.skipAssignment,
              observaciones: pub.observaciones,
            },
          });
          existingNamesSet.add(normalized); // prevent dups within same batch
          result.created++;
        } catch (err) {
          result.errors.push(
            `${pub.nombre}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    });

    revalidatePath('/[locale]/publishers', 'page');
    revalidatePath('/[locale]/settings', 'page');
  } catch (err) {
    result.errors.push(
      `Transaction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// MEETING WEEKS CSV IMPORT
// ═══════════════════════════════════════════════════════════════════════

// ─── CSV Template ─────────────────────────────────────────────────────

const WEEKS_CSV_HEADERS = [
  'fecha_inicio',
  'lectura_semanal',
  'cancion_apertura',
  'cancion_intermedia',
  'cancion_cierre',
  'sala_auxiliar',
  'seccion',
  'tipo',
  'titulo',
  'orden',
  'duracion',
  'sala',
  'requiere_ayudante',
  'publicador',
  'ayudante',
] as const;

const WEEKS_EXAMPLE_ROWS = [
  '17/03/2026,Isaias 30:1-18,12,3,3,Si,Apertura,Discurso,Presidente,1,,Principal,No,Jorge Romero,',
  '17/03/2026,,,,,,Apertura,Oracion,Oración inicial,2,,Principal,No,Bryan Diaz,',
  '17/03/2026,,,,,,Tesoros,Discurso,Discurso Tesoros,1,10,Principal,No,Wilson Acevedo,',
  '17/03/2026,,,,,,Tesoros,Analisis,Perlas escondidas,2,10,Principal,No,Leonardo Otalora,',
  '17/03/2026,,,,,,Tesoros,Lectura,Lectura de la Biblia,3,4,Principal,No,Isaias Herrera,',
  '17/03/2026,,,,,,Seamos mejores maestros,Discurso,Encargado de escuela,1,,Principal,No,Miller Medina,',
  '17/03/2026,,,,,,Seamos mejores maestros,Demostracion,Iniciemos conversaciones,2,4,Principal,Si,Eva Ibañez,Lilian Orjuela',
  '17/03/2026,,,,,,Seamos mejores maestros,Demostracion,Hagamos revisitas,3,4,Principal,Si,Sandra Gil,Ingrid Medina',
  '17/03/2026,,,,,,Seamos mejores maestros,Lectura,Lectura de la Biblia,4,4,Principal,No,Sebastian Torres,',
  '17/03/2026,,,,,,Nuestra vida cristiana,Discurso,Necesidades locales,1,15,Principal,No,Carlos Perez,',
  '17/03/2026,,,,,,Nuestra vida cristiana,Estudio,Estudio bíblico,2,30,Principal,No,Daniel Rodriguez,',
  '17/03/2026,,,,,,Cierre,Oracion,Oración final,1,,Principal,No,Andres Lopez,',
];

export async function downloadWeeksCsvTemplateAction(): Promise<string> {
  const BOM = '\uFEFF';
  const header = WEEKS_CSV_HEADERS.join(',');
  return BOM + header + '\n' + WEEKS_EXAMPLE_ROWS.join('\n') + '\n';
}

// ─── Types ────────────────────────────────────────────────────────────

export type ParsedWeekPart = {
  seccion: Section;
  tipo: PartType;
  titulo: string | null;
  orden: number;
  duracion: number | null;
  sala: Room;
  requiereAyudante: boolean;
  publicadorNombre: string | null;
  publicadorId: string | null;
  ayudanteNombre: string | null;
  ayudanteId: string | null;
};

export type ParsedWeek = {
  fechaInicio: Date;
  fechaInicioStr: string;
  lecturaSemanal: string;
  cancionApertura: number;
  cancionIntermedia: number;
  cancionCierre: number;
  salaAuxiliarActiva: boolean;
  parts: ParsedWeekPart[];
};

export type WeeksParseResult = {
  valid: ParsedWeek[];
  errors: CsvRowError[];
  existingInDb: string[];
};

export type WeeksImportResult = {
  weeksCreated: number;
  partsCreated: number;
  assignmentsCreated: number;
  skipped: number;
  errors: string[];
};

// ─── Parse CSV Action ─────────────────────────────────────────────────

export async function parseWeeksCsvAction(
  formData: FormData
): Promise<
  { success: true; data: WeeksParseResult } | { success: false; error: string }
> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!file.name.endsWith('.csv')) {
      return { success: false, error: 'File must be a CSV file (.csv)' };
    }

    const text = await file.text();
    const clean = text.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV file must have a header row and at least one data row',
      };
    }

    // Parse header
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

    // Validate required headers
    const requiredHeaders = ['fecha_inicio', 'seccion', 'tipo'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
      };
    }

    // Build column index map
    const colIndex: Record<string, number> = {};
    for (let i = 0; i < headers.length; i++) {
      colIndex[headers[i]] = i;
    }

    // Load all publishers for name matching
    const allPublishers = await prisma.publisher.findMany({
      select: { id: true, nombre: true },
    });
    const publisherByName = new Map<string, { id: string; nombre: string }>();
    for (const pub of allPublishers) {
      publisherByName.set(pub.nombre.trim().toLowerCase(), pub);
    }

    const errors: CsvRowError[] = [];

    // Group rows by fecha_inicio
    // First pass: parse all rows into raw groups
    const rawGroups = new Map<
      string,
      { rows: { fields: string[]; rowNumber: number }[]; date: Date }
    >();

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const fields = parseCsvLine(lines[i]);

      const getValue = (col: string): string => {
        const idx = colIndex[col];
        return idx !== undefined && idx < fields.length
          ? fields[idx].trim()
          : '';
      };

      // fecha_inicio is required on every row
      const fechaRaw = getValue('fecha_inicio');
      if (!fechaRaw) {
        errors.push({
          row: rowNumber,
          field: 'fecha_inicio',
          message: 'fecha_inicio es requerida en cada fila',
        });
        continue;
      }

      const fecha = parseDateDMY(fechaRaw);
      if (!fecha) {
        errors.push({
          row: rowNumber,
          field: 'fecha_inicio',
          message: `Fecha inválida: "${fechaRaw}". Use formato DD/MM/YYYY`,
        });
        continue;
      }

      // Validate it's a Monday
      if (fecha.getDay() !== 1) {
        errors.push({
          row: rowNumber,
          field: 'fecha_inicio',
          message: `La fecha "${fechaRaw}" no es lunes`,
        });
        continue;
      }

      const dateKey = fechaRaw;
      if (!rawGroups.has(dateKey)) {
        rawGroups.set(dateKey, { rows: [], date: fecha });
      }
      rawGroups.get(dateKey)!.rows.push({ fields, rowNumber });
    }

    // Second pass: validate each group
    const validWeeks: ParsedWeek[] = [];

    for (const [dateKey, group] of rawGroups) {
      const { rows, date } = group;
      if (rows.length === 0) continue;

      const firstRow = rows[0];
      const getFirstValue = (col: string): string => {
        const idx = colIndex[col];
        return idx !== undefined && idx < firstRow.fields.length
          ? firstRow.fields[idx].trim()
          : '';
      };

      // Week-level fields from first row
      const lecturaSemanal = getFirstValue('lectura_semanal');
      if (!lecturaSemanal) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'lectura_semanal',
          message:
            'lectura_semanal es requerida en la primera fila del grupo de la semana',
        });
        continue;
      }

      const cancionAperturaRaw = getFirstValue('cancion_apertura');
      const cancionIntermediaRaw = getFirstValue('cancion_intermedia');
      const cancionCierreRaw = getFirstValue('cancion_cierre');

      const cancionApertura = parseInt(cancionAperturaRaw, 10);
      const cancionIntermedia = parseInt(cancionIntermediaRaw, 10);
      const cancionCierre = parseInt(cancionCierreRaw, 10);

      let weekHasError = false;

      if (!cancionAperturaRaw || isNaN(cancionApertura)) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'cancion_apertura',
          message: 'cancion_apertura es requerida y debe ser un número',
        });
        weekHasError = true;
      } else if (cancionApertura < 1 || cancionApertura > 151) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'cancion_apertura',
          message: `cancion_apertura debe estar entre 1 y 151 (recibido: ${cancionApertura})`,
        });
        weekHasError = true;
      }

      if (!cancionIntermediaRaw || isNaN(cancionIntermedia)) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'cancion_intermedia',
          message: 'cancion_intermedia es requerida y debe ser un número',
        });
        weekHasError = true;
      } else if (cancionIntermedia < 1 || cancionIntermedia > 151) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'cancion_intermedia',
          message: `cancion_intermedia debe estar entre 1 y 151 (recibido: ${cancionIntermedia})`,
        });
        weekHasError = true;
      }

      if (!cancionCierreRaw || isNaN(cancionCierre)) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'cancion_cierre',
          message: 'cancion_cierre es requerida y debe ser un número',
        });
        weekHasError = true;
      } else if (cancionCierre < 1 || cancionCierre > 151) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'cancion_cierre',
          message: `cancion_cierre debe estar entre 1 y 151 (recibido: ${cancionCierre})`,
        });
        weekHasError = true;
      }

      if (weekHasError) continue;

      const salaAuxiliarActiva = parseBoolean(getFirstValue('sala_auxiliar'));

      // Parse parts from all rows in this group
      const parts: ParsedWeekPart[] = [];
      let groupHasError = false;

      for (const { fields, rowNumber } of rows) {
        const getValue = (col: string): string => {
          const idx = colIndex[col];
          return idx !== undefined && idx < fields.length
            ? fields[idx].trim()
            : '';
        };

        // seccion (required)
        const seccionRaw = getValue('seccion').toLowerCase();
        const seccion = SECTION_MAP[seccionRaw];
        if (!seccion) {
          errors.push({
            row: rowNumber,
            field: 'seccion',
            message: `Sección inválida: "${getValue('seccion')}". Use: Apertura/Tesoros/Seamos mejores maestros/Nuestra vida cristiana/Cierre`,
          });
          groupHasError = true;
          continue;
        }

        // tipo (required)
        const tipoRaw = getValue('tipo').toLowerCase();
        const tipo = PART_TYPE_MAP[tipoRaw];
        if (!tipo) {
          errors.push({
            row: rowNumber,
            field: 'tipo',
            message: `Tipo inválido: "${getValue('tipo')}". Use: Discurso/Demostracion/Lectura/Analisis/Estudio/Oracion/Cancion`,
          });
          groupHasError = true;
          continue;
        }

        // titulo (optional)
        const titulo = getValue('titulo') || null;

        // orden (required, integer)
        const ordenRaw = getValue('orden');
        const orden = parseInt(ordenRaw, 10);
        if (!ordenRaw || isNaN(orden) || orden < 1) {
          errors.push({
            row: rowNumber,
            field: 'orden',
            message: `orden es requerido y debe ser un entero positivo (recibido: "${ordenRaw}")`,
          });
          groupHasError = true;
          continue;
        }

        // duracion (optional, integer)
        const duracionRaw = getValue('duracion');
        let duracion: number | null = null;
        if (duracionRaw) {
          duracion = parseInt(duracionRaw, 10);
          if (isNaN(duracion) || duracion < 1) {
            errors.push({
              row: rowNumber,
              field: 'duracion',
              message: `duracion debe ser un entero positivo (recibido: "${duracionRaw}")`,
            });
            groupHasError = true;
            continue;
          }
        }

        // sala (default: Principal)
        const salaRaw = getValue('sala').toLowerCase();
        const sala = salaRaw ? ROOM_MAP[salaRaw] : Room.MAIN;
        if (salaRaw && !sala) {
          errors.push({
            row: rowNumber,
            field: 'sala',
            message: `Sala inválida: "${getValue('sala')}". Use: Principal/Auxiliar`,
          });
          groupHasError = true;
          continue;
        }

        const requiereAyudante = parseBoolean(getValue('requiere_ayudante'));

        // publicador (optional — a part without assignment)
        const publicadorRaw = getValue('publicador');
        let publicadorId: string | null = null;
        let publicadorNombre: string | null = null;
        if (publicadorRaw) {
          const publisher = publisherByName.get(
            publicadorRaw.trim().toLowerCase()
          );
          if (!publisher) {
            errors.push({
              row: rowNumber,
              field: 'publicador',
              message: `Publicador no encontrado: "${publicadorRaw}"`,
            });
            groupHasError = true;
            continue;
          }
          publicadorId = publisher.id;
          publicadorNombre = publisher.nombre;
        }

        // ayudante (optional)
        const ayudanteRaw = getValue('ayudante');
        let ayudanteId: string | null = null;
        let ayudanteNombre: string | null = null;
        if (ayudanteRaw) {
          const helper = publisherByName.get(ayudanteRaw.trim().toLowerCase());
          if (!helper) {
            errors.push({
              row: rowNumber,
              field: 'ayudante',
              message: `Ayudante no encontrado: "${ayudanteRaw}"`,
            });
            groupHasError = true;
            continue;
          }
          ayudanteId = helper.id;
          ayudanteNombre = helper.nombre;
        }

        parts.push({
          seccion,
          tipo,
          titulo,
          orden,
          duracion,
          sala: sala ?? Room.MAIN,
          requiereAyudante,
          publicadorId,
          publicadorNombre,
          ayudanteId,
          ayudanteNombre,
        });
      }

      if (groupHasError) continue;

      if (parts.length === 0) {
        errors.push({
          row: firstRow.rowNumber,
          field: 'parts',
          message: `La semana ${dateKey} no tiene partes válidas`,
        });
        continue;
      }

      validWeeks.push({
        fechaInicio: date,
        fechaInicioStr: dateKey,
        lecturaSemanal,
        cancionApertura,
        cancionIntermedia,
        cancionCierre,
        salaAuxiliarActiva,
        parts,
      });
    }

    // Check for existing weeks in DB
    const existingInDb: string[] = [];
    if (validWeeks.length > 0) {
      const existingWeeks = await prisma.meetingWeek.findMany({
        select: { fechaInicio: true },
      });
      const existingDates = new Set(
        existingWeeks.map((w) => w.fechaInicio.toISOString().slice(0, 10))
      );

      for (const week of validWeeks) {
        const isoDate = week.fechaInicio.toISOString().slice(0, 10);
        if (existingDates.has(isoDate)) {
          existingInDb.push(week.fechaInicioStr);
        }
      }
    }

    return {
      success: true,
      data: { valid: validWeeks, errors, existingInDb },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse CSV',
    };
  }
}

// ─── Import Weeks Action ──────────────────────────────────────────────

export async function importWeeksAction(
  weeks: ParsedWeek[]
): Promise<WeeksImportResult> {
  const result: WeeksImportResult = {
    weeksCreated: 0,
    partsCreated: 0,
    assignmentsCreated: 0,
    skipped: 0,
    errors: [],
  };

  if (weeks.length === 0) {
    return result;
  }

  try {
    // Get existing week dates for duplicate detection
    const existingWeeks = await prisma.meetingWeek.findMany({
      select: { fechaInicio: true },
    });
    const existingDates = new Set(
      existingWeeks.map((w) => w.fechaInicio.toISOString().slice(0, 10))
    );

    for (const week of weeks) {
      const isoDate = week.fechaInicio.toISOString().slice(0, 10);

      if (existingDates.has(isoDate)) {
        result.skipped++;
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create MeetingWeek
          const fechaFin = new Date(week.fechaInicio);
          fechaFin.setDate(fechaFin.getDate() + 6);

          const createdWeek = await tx.meetingWeek.create({
            data: {
              fechaInicio: week.fechaInicio,
              fechaFin,
              lecturaSemanal: week.lecturaSemanal.trim(),
              cancionApertura: week.cancionApertura,
              cancionIntermedia: week.cancionIntermedia,
              cancionCierre: week.cancionCierre,
              salaAuxiliarActiva: week.salaAuxiliarActiva,
              estado: 'DRAFT',
            },
          });

          // 2. Create MeetingParts + Assignments
          for (const part of week.parts) {
            const createdPart = await tx.meetingPart.create({
              data: {
                meetingWeekId: createdWeek.id,
                seccion: part.seccion,
                tipo: part.tipo,
                titulo: part.titulo,
                orden: part.orden,
                duracion: part.duracion,
                sala: part.sala,
                requiereAyudante: part.requiereAyudante,
              },
            });
            result.partsCreated++;

            // 3. Create Assignment if publisher is specified
            if (part.publicadorId) {
              await tx.assignment.create({
                data: {
                  meetingPartId: createdPart.id,
                  publisherId: part.publicadorId,
                  helperId: part.ayudanteId,
                },
              });
              result.assignmentsCreated++;
            }
          }
        });

        existingDates.add(isoDate);
        result.weeksCreated++;
      } catch (err) {
        result.errors.push(
          `Semana ${week.fechaInicioStr}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    revalidatePath('/[locale]/weeks', 'page');
    revalidatePath('/[locale]/settings', 'page');
  } catch (err) {
    result.errors.push(
      `Error general: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// ASSIGNMENT HISTORY CSV IMPORT
// ═══════════════════════════════════════════════════════════════════════

// ─── CSV Template ─────────────────────────────────────────────────────

const HISTORY_CSV_HEADERS = [
  'fecha',
  'seccion',
  'tipo',
  'titulo',
  'sala',
  'publicador',
  'ayudante',
] as const;

const HISTORY_EXAMPLE_ROWS = [
  '17/03/2026,Tesoros,Discurso,Perlas escondidas,Principal,Juan Perez,',
  '17/03/2026,Seamos mejores maestros,Lectura,Lectura de la Biblia,Principal,Pedro Garcia,',
  '17/03/2026,Seamos mejores maestros,Demostracion,Iniciemos conversaciones,Principal,Maria Lopez,Ana Torres',
];

export async function downloadHistoryCsvTemplateAction(): Promise<string> {
  const BOM = '\uFEFF';
  const header = HISTORY_CSV_HEADERS.join(',');
  return BOM + header + '\n' + HISTORY_EXAMPLE_ROWS.join('\n') + '\n';
}

// ─── Value Mappings ───────────────────────────────────────────────────

const SECTION_MAP: Record<string, Section> = {
  apertura: Section.OPENING,
  opening: Section.OPENING,
  tesoros: Section.TREASURES,
  treasures: Section.TREASURES,
  'seamos mejores maestros': Section.MINISTRY_SCHOOL,
  'ministry school': Section.MINISTRY_SCHOOL,
  'nuestra vida cristiana': Section.CHRISTIAN_LIFE,
  'christian life': Section.CHRISTIAN_LIFE,
  cierre: Section.CLOSING,
  closing: Section.CLOSING,
};

const PART_TYPE_MAP: Record<string, PartType> = {
  discurso: PartType.SPEECH,
  speech: PartType.SPEECH,
  demostracion: PartType.DEMONSTRATION,
  demostración: PartType.DEMONSTRATION,
  demonstration: PartType.DEMONSTRATION,
  lectura: PartType.READING,
  reading: PartType.READING,
  analisis: PartType.DISCUSSION,
  análisis: PartType.DISCUSSION,
  discussion: PartType.DISCUSSION,
  estudio: PartType.STUDY,
  study: PartType.STUDY,
  oracion: PartType.PRAYER,
  oración: PartType.PRAYER,
  prayer: PartType.PRAYER,
  cancion: PartType.SONG,
  canción: PartType.SONG,
  song: PartType.SONG,
};

const ROOM_MAP: Record<string, Room> = {
  principal: Room.MAIN,
  main: Room.MAIN,
  auxiliar: Room.AUXILIARY_1,
  'auxiliar 1': Room.AUXILIARY_1,
  'auxiliary 1': Room.AUXILIARY_1,
  auxiliary: Room.AUXILIARY_1,
};

// ─── Types ────────────────────────────────────────────────────────────

export type ParsedHistoryRow = {
  fecha: Date;
  semana: string;
  seccion: Section;
  tipo: PartType;
  titulo: string | null;
  sala: Room;
  publisherId: string;
  publisherNombre: string;
  helperId: string | null;
  helperNombre: string | null;
};

export type HistoryParseResult = {
  valid: ParsedHistoryRow[];
  errors: CsvRowError[];
  duplicatesInCsv: string[];
};

export type HistoryImportResult = {
  created: number;
  errors: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Parse DD/MM/YYYY into a Date object.
 * Returns null if invalid.
 */
function parseDateDMY(raw: string): Date | null {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dayStr, monthStr, yearStr] = match;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  // Verify the date didn't overflow (e.g., Feb 31 → March)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Derive ISO week label from a Date: "YYYY-Www"
 * Uses ISO 8601 week numbering.
 */
function getISOWeekLabel(date: Date): string {
  // Create a copy to avoid mutation
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate week number
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

// ─── Parse CSV Action ─────────────────────────────────────────────────

export async function parseHistoryCsvAction(
  formData: FormData
): Promise<
  | { success: true; data: HistoryParseResult }
  | { success: false; error: string }
> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!file.name.endsWith('.csv')) {
      return { success: false, error: 'File must be a CSV file (.csv)' };
    }

    const text = await file.text();
    const clean = text.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV file must have a header row and at least one data row',
      };
    }

    // Parse header
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

    // Validate required headers
    const requiredHeaders = ['fecha', 'seccion', 'tipo', 'publicador'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
      };
    }

    // Build column index map
    const colIndex: Record<string, number> = {};
    for (let i = 0; i < headers.length; i++) {
      colIndex[headers[i]] = i;
    }

    // Load all publishers for name matching
    const allPublishers = await prisma.publisher.findMany({
      select: { id: true, nombre: true },
    });
    const publisherByName = new Map<string, { id: string; nombre: string }>();
    for (const pub of allPublishers) {
      publisherByName.set(pub.nombre.trim().toLowerCase(), pub);
    }

    const valid: ParsedHistoryRow[] = [];
    const errors: CsvRowError[] = [];
    const seenKeys = new Map<string, number>(); // composite key → first row
    const duplicatesInCsv: string[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const fields = parseCsvLine(lines[i]);

      const getValue = (col: string): string => {
        const idx = colIndex[col];
        return idx !== undefined && idx < fields.length
          ? fields[idx].trim()
          : '';
      };

      // ── fecha
      const fechaRaw = getValue('fecha');
      if (!fechaRaw) {
        errors.push({
          row: rowNumber,
          field: 'fecha',
          message: 'Fecha es requerida',
        });
        continue;
      }
      const fecha = parseDateDMY(fechaRaw);
      if (!fecha) {
        errors.push({
          row: rowNumber,
          field: 'fecha',
          message: `Fecha inválida: "${fechaRaw}". Use formato DD/MM/YYYY`,
        });
        continue;
      }

      // ── seccion
      const seccionRaw = getValue('seccion').toLowerCase();
      const seccion = SECTION_MAP[seccionRaw];
      if (!seccion) {
        errors.push({
          row: rowNumber,
          field: 'seccion',
          message: `Sección inválida: "${getValue('seccion')}". Use: Apertura/Tesoros/Seamos mejores maestros/Nuestra vida cristiana/Cierre`,
        });
        continue;
      }

      // ── tipo
      const tipoRaw = getValue('tipo').toLowerCase();
      const tipo = PART_TYPE_MAP[tipoRaw];
      if (!tipo) {
        errors.push({
          row: rowNumber,
          field: 'tipo',
          message: `Tipo inválido: "${getValue('tipo')}". Use: Discurso/Demostracion/Lectura/Analisis/Estudio/Oracion/Cancion`,
        });
        continue;
      }

      // ── titulo (optional)
      const titulo = getValue('titulo') || null;

      // ── sala (default: MAIN)
      const salaRaw = getValue('sala').toLowerCase();
      const sala = salaRaw ? ROOM_MAP[salaRaw] : Room.MAIN;
      if (salaRaw && !sala) {
        errors.push({
          row: rowNumber,
          field: 'sala',
          message: `Sala inválida: "${getValue('sala')}". Use: Principal/Auxiliar`,
        });
        continue;
      }

      // ── publicador (required, must exist in DB)
      const publicadorRaw = getValue('publicador');
      if (!publicadorRaw) {
        errors.push({
          row: rowNumber,
          field: 'publicador',
          message: 'Publicador es requerido',
        });
        continue;
      }
      const publisher = publisherByName.get(publicadorRaw.trim().toLowerCase());
      if (!publisher) {
        errors.push({
          row: rowNumber,
          field: 'publicador',
          message: `Publicador no encontrado: "${publicadorRaw}"`,
        });
        continue;
      }

      // ── ayudante (optional, must exist in DB if provided)
      const ayudanteRaw = getValue('ayudante');
      let helperId: string | null = null;
      let helperNombre: string | null = null;
      if (ayudanteRaw) {
        const helper = publisherByName.get(ayudanteRaw.trim().toLowerCase());
        if (!helper) {
          errors.push({
            row: rowNumber,
            field: 'ayudante',
            message: `Ayudante no encontrado: "${ayudanteRaw}"`,
          });
          continue;
        }
        helperId = helper.id;
        helperNombre = helper.nombre;
      }

      // ── Derive semana
      const semana = getISOWeekLabel(fecha);

      // ── Duplicate detection (same date + section + type + publisher + room)
      const compositeKey = `${fecha.toISOString()}|${seccion}|${tipo}|${publisher.id}|${sala ?? Room.MAIN}`;
      const firstRow = seenKeys.get(compositeKey);
      if (firstRow !== undefined) {
        duplicatesInCsv.push(
          `Fila ${rowNumber}: duplicado de fila ${firstRow}`
        );
        errors.push({
          row: rowNumber,
          field: 'fecha+seccion+tipo+publicador+sala',
          message: `Registro duplicado en CSV (primera aparición en fila ${firstRow})`,
        });
        continue;
      }
      seenKeys.set(compositeKey, rowNumber);

      valid.push({
        fecha,
        semana,
        seccion,
        tipo,
        titulo,
        sala: sala ?? Room.MAIN,
        publisherId: publisher.id,
        publisherNombre: publisher.nombre,
        helperId,
        helperNombre,
      });
    }

    return {
      success: true,
      data: { valid, errors, duplicatesInCsv },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse CSV',
    };
  }
}

// ─── Import History Action ────────────────────────────────────────────

const HISTORY_BATCH_SIZE = 500;

export async function importHistoryAction(
  records: ParsedHistoryRow[]
): Promise<HistoryImportResult> {
  const result: HistoryImportResult = { created: 0, errors: [] };

  if (records.length === 0) {
    return result;
  }

  try {
    // Process in batches of 500
    for (let i = 0; i < records.length; i += HISTORY_BATCH_SIZE) {
      const batch = records.slice(i, i + HISTORY_BATCH_SIZE);

      await prisma.$transaction(async (tx) => {
        for (const record of batch) {
          try {
            await tx.assignmentHistory.create({
              data: {
                fecha: record.fecha,
                semana: record.semana,
                seccion: record.seccion,
                tipo: record.tipo,
                titulo: record.titulo,
                sala: record.sala,
                publisherId: record.publisherId,
                publisherNombre: record.publisherNombre,
                helperId: record.helperId,
                helperNombre: record.helperNombre,
              },
            });
            result.created++;
          } catch (err) {
            result.errors.push(
              `${record.publisherNombre} (${record.semana}): ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }
      });
    }

    revalidatePath('/[locale]/settings', 'page');
  } catch (err) {
    result.errors.push(
      `Transaction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}
