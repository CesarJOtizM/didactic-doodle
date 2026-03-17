// ─── Migration Report ────────────────────────────────────────────────

export type MigrationReport = {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
};

// ─── Publisher Matching ──────────────────────────────────────────────

export type PublisherMatch = {
  excelName: string;
  publisherId: string | null;
  publisherName: string | null;
  status: 'matched' | 'unmatched';
};

export type MatchResult = {
  matches: PublisherMatch[];
  matchedCount: number;
  unmatchedCount: number;
};

// ─── Excel Row Types ─────────────────────────────────────────────────

/**
 * Raw row from the "Inscritos" sheet.
 * Column mapping will be resolved in the parser.
 */
export type ExcelInscrito = {
  nombre: string;
  habilitadoVMC?: boolean;
  habilitadoAcomodador?: boolean;
  habilitadoMicrofono?: boolean;
};

/**
 * Raw row from the "Historico Asignaciones" sheet.
 */
export type ExcelHistorico = {
  fecha: string;
  semana: string;
  seccion: string;
  tipo: string;
  titulo: string;
  sala: string;
  nombreTitular: string;
  nombreAyudante?: string;
};

/**
 * Raw row from the "Variables" sheet.
 */
export type ExcelVariable = {
  fecha: string;
  lecturaSemanal: string;
  cancionApertura: number;
  cancionIntermedia: number;
  cancionCierre: number;
  salaAuxiliarActiva: boolean;
  partes: ExcelVariablePart[];
};

export type ExcelVariablePart = {
  seccion: string;
  tipo: string;
  titulo: string;
  orden: number;
  duracion: number;
  sala: string;
  requiereAyudante: boolean;
};

// ─── Parsed Excel Result ─────────────────────────────────────────────

export type ParsedExcel = {
  inscritos: ExcelInscrito[];
  historico: ExcelHistorico[];
  variables: ExcelVariable[];
  sheetCounts: {
    inscritos: number;
    historico: number;
    variables: number;
  };
};
