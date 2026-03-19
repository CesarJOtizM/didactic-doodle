'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/data/prisma';
import { Gender, Role, PublisherStatus } from '@/generated/prisma/enums';

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
