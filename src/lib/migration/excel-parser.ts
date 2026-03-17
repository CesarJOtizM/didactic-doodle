import * as XLSX from 'xlsx';
import type {
  ParsedExcel,
  ExcelInscrito,
  ExcelHistorico,
  ExcelVariable,
  ExcelVariablePart,
} from './types';

// ─── Sheet Names ─────────────────────────────────────────────────────

const REQUIRED_SHEETS = [
  'Inscritos',
  'Variables',
  'Historico Asignaciones',
] as const;

// ─── Excel Date Helper ───────────────────────────────────────────────

/**
 * Convert Excel serial date number to ISO date string (YYYY-MM-DD).
 * Excel serial dates: days since 1900-01-01 (with the Lotus 1-2-3 bug).
 */
function excelDateToISO(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// ─── Parse Uploaded File ─────────────────────────────────────────────

/**
 * Parse an uploaded Excel file buffer into structured data.
 * Validates required sheets exist before parsing.
 */
export function parseExcelFile(buffer: ArrayBuffer): ParsedExcel {
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Validate required sheets
  const missingSheets = REQUIRED_SHEETS.filter(
    (name) => !workbook.SheetNames.includes(name)
  );
  if (missingSheets.length > 0) {
    throw new Error(
      `Missing required sheets: ${missingSheets.join(', ')}. Found: ${workbook.SheetNames.join(', ')}`
    );
  }

  const inscritos = parseInscritos(workbook.Sheets['Inscritos']);
  const historico = parseHistorico(workbook.Sheets['Historico Asignaciones']);
  const variables = parseVariables(workbook.Sheets['Variables']);

  return {
    inscritos,
    historico,
    variables,
    sheetCounts: {
      inscritos: inscritos.length,
      historico: historico.length,
      variables: variables.length,
    },
  };
}

// ─── Sheet Parsers ───────────────────────────────────────────────────

/**
 * Parse "Inscritos" sheet.
 * Columns: Publicador, Sexo, Titular, Ayudante, Aprobado, Ultima Titular, Ultima Ayudante, Observaciones
 * We extract: nombre, habilitadoVMC (Aprobado = "Si")
 */
function parseInscritos(ws: XLSX.WorkSheet): ExcelInscrito[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  const results: ExcelInscrito[] = [];

  for (const row of rows) {
    const nombre = String(row['Publicador'] ?? '').trim();
    if (!nombre) continue;

    const aprobado = String(row['Aprobado'] ?? '')
      .trim()
      .toLowerCase();

    results.push({
      nombre,
      habilitadoVMC: aprobado === 'si',
      // The Excel doesn't have explicit acomodador/microfono flags
      // These will default to existing values if not overridden
    });
  }

  return results;
}

/**
 * Parse "Historico Asignaciones" sheet.
 * Columns: ID, Fecha, Ord, Parte, Titular, Ayudante, Asignaciones, Mes
 */
function parseHistorico(ws: XLSX.WorkSheet): ExcelHistorico[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  const results: ExcelHistorico[] = [];

  for (const row of rows) {
    const fechaRaw = row['Fecha'];
    if (!fechaRaw || typeof fechaRaw !== 'number') continue;

    const parte = String(row['Parte'] ?? '').trim();
    if (!parte) continue;

    const titular = String(row['Titular'] ?? '').trim();
    const ayudante = String(row['Ayudante'] ?? '').trim();
    const asignaciones = String(row['Asignaciones'] ?? '').trim();

    const { seccion, tipo, sala } = mapParteToSectionAndType(parte);

    results.push({
      fecha: excelDateToISO(fechaRaw),
      semana: '', // Will be derived from fecha during import
      seccion,
      tipo,
      titulo: asignaciones || parte,
      sala,
      nombreTitular: titular || '',
      nombreAyudante: ayudante || undefined,
    });
  }

  return results;
}

/**
 * Map Excel "Parte" names to our Section/PartType/Room enums.
 */
function mapParteToSectionAndType(parte: string): {
  seccion: string;
  tipo: string;
  sala: string;
} {
  const mapping: Record<
    string,
    { seccion: string; tipo: string; sala: string }
  > = {
    Presidente: { seccion: 'OPENING', tipo: 'SPEECH', sala: 'MAIN' },
    'Consejero Aux.': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'SPEECH',
      sala: 'MAIN',
    },
    'Tesoros Disc.': { seccion: 'TREASURES', tipo: 'SPEECH', sala: 'MAIN' },
    Busquemos: { seccion: 'TREASURES', tipo: 'DISCUSSION', sala: 'MAIN' },
    Lectura: { seccion: 'TREASURES', tipo: 'READING', sala: 'MAIN' },
    'Lectura Aux.': {
      seccion: 'TREASURES',
      tipo: 'READING',
      sala: 'AUXILIARY_1',
    },
    'SMM 1': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'MAIN',
    },
    'SMM 2': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'MAIN',
    },
    'SMM 3': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'MAIN',
    },
    'SMM 4': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'MAIN',
    },
    'SMM 1 Aux.': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'AUXILIARY_1',
    },
    'SMM 2 Aux.': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'AUXILIARY_1',
    },
    'SMM 3 Aux.': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'AUXILIARY_1',
    },
    'SMM 4 Aux.': {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'DEMONSTRATION',
      sala: 'AUXILIARY_1',
    },
    'NVC 1': { seccion: 'CHRISTIAN_LIFE', tipo: 'SPEECH', sala: 'MAIN' },
    'NVC 2': { seccion: 'CHRISTIAN_LIFE', tipo: 'SPEECH', sala: 'MAIN' },
    'Estudio Cond.': {
      seccion: 'CHRISTIAN_LIFE',
      tipo: 'STUDY',
      sala: 'MAIN',
    },
    'Estudio Lect.': {
      seccion: 'CHRISTIAN_LIFE',
      tipo: 'READING',
      sala: 'MAIN',
    },
    Oración: { seccion: 'CLOSING', tipo: 'PRAYER', sala: 'MAIN' },
  };

  return (
    mapping[parte] ?? {
      seccion: 'MINISTRY_SCHOOL',
      tipo: 'SPEECH',
      sala: 'MAIN',
    }
  );
}

/**
 * Parse "Variables" sheet — one row per week.
 * Columns: Asignación, ID, null, null, Fechas Reunion, Capitulos, Canción,
 *          Tesoros Disc., Lectura, SMM 1-4, Lectura Aux., SMM 1-4 Aux.,
 *          Canción, NVC 1-2, Canción
 */
function parseVariables(ws: XLSX.WorkSheet): ExcelVariable[] {
  const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  const results: ExcelVariable[] = [];

  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row) continue;

    const fechaRaw = row[4];
    if (!fechaRaw || typeof fechaRaw !== 'number') continue;

    const fecha = excelDateToISO(fechaRaw);
    const lecturaSemanal = String(row[5] ?? '').trim();
    const cancionApertura = Number(row[6]) || 0;
    const cancionIntermedia = Number(row[18]) || 0;
    const cancionCierre = Number(row[21]) || 0;

    // Build parts from columns
    const partes: ExcelVariablePart[] = [];
    let orden = 1;

    // Col 7: Tesoros Disc. (TREASURES / SPEECH)
    if (row[7]) {
      partes.push({
        seccion: 'TREASURES',
        tipo: 'SPEECH',
        titulo: String(row[7]).trim(),
        orden: orden++,
        duracion: extractDuration(String(row[7])),
        sala: 'MAIN',
        requiereAyudante: false,
      });
    }

    // Col 8: Lectura (TREASURES / READING) — Main
    if (row[8]) {
      partes.push({
        seccion: 'TREASURES',
        tipo: 'READING',
        titulo: String(row[8]).trim(),
        orden: orden++,
        duracion: 4,
        sala: 'MAIN',
        requiereAyudante: false,
      });
    }

    // Cols 9-12: SMM 1-4 Main (MINISTRY_SCHOOL / DEMONSTRATION)
    let smmOrden = 1;
    for (let col = 9; col <= 12; col++) {
      if (row[col]) {
        const titulo = String(row[col]).trim();
        const isDiscurso =
          titulo.toLowerCase().includes('discurso') ||
          titulo.toLowerCase().includes('discourse');
        partes.push({
          seccion: 'MINISTRY_SCHOOL',
          tipo: isDiscurso ? 'SPEECH' : 'DEMONSTRATION',
          titulo,
          orden: smmOrden++,
          duracion: extractDuration(titulo),
          sala: 'MAIN',
          requiereAyudante: !isDiscurso,
        });
      }
    }

    // Check if auxiliary sala is active (cols 13-17)
    const hasAux = [13, 14, 15, 16, 17].some(
      (col) => row[col] !== null && row[col] !== undefined
    );

    // Col 13: Lectura Aux. (TREASURES / READING)
    if (row[13]) {
      partes.push({
        seccion: 'TREASURES',
        tipo: 'READING',
        titulo: String(row[13]).trim(),
        orden: 99, // Auxiliary reading
        duracion: 4,
        sala: 'AUXILIARY_1',
        requiereAyudante: false,
      });
    }

    // Cols 14-17: SMM 1-4 Aux (MINISTRY_SCHOOL / DEMONSTRATION)
    let smmAuxOrden = 1;
    for (let col = 14; col <= 17; col++) {
      if (row[col]) {
        const titulo = String(row[col]).trim();
        const isDiscurso =
          titulo.toLowerCase().includes('discurso') ||
          titulo.toLowerCase().includes('discourse');
        partes.push({
          seccion: 'MINISTRY_SCHOOL',
          tipo: isDiscurso ? 'SPEECH' : 'DEMONSTRATION',
          titulo,
          orden: smmAuxOrden++,
          duracion: extractDuration(titulo),
          sala: 'AUXILIARY_1',
          requiereAyudante: !isDiscurso,
        });
      }
    }

    // Cols 19-20: NVC 1-2 (CHRISTIAN_LIFE / SPEECH)
    let nvcOrden = 1;
    for (let col = 19; col <= 20; col++) {
      if (row[col]) {
        partes.push({
          seccion: 'CHRISTIAN_LIFE',
          tipo: 'SPEECH',
          titulo: String(row[col]).trim(),
          orden: nvcOrden++,
          duracion: extractDuration(String(row[col])),
          sala: 'MAIN',
          requiereAyudante: false,
        });
      }
    }

    results.push({
      fecha,
      lecturaSemanal,
      cancionApertura,
      cancionIntermedia,
      cancionCierre,
      salaAuxiliarActiva: hasAux,
      partes,
    });
  }

  return results;
}

/**
 * Extract duration in minutes from a part title string.
 * Looks for patterns like "(10 mins.)", "(4 mins)", "(15 min)"
 */
function extractDuration(titulo: string): number {
  const match = titulo.match(/\((\d+)\s*min/i);
  return match ? parseInt(match[1], 10) : 5;
}
