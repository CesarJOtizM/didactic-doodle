'use server';

import { parseExcelFile } from '@/lib/migration/excel-parser';
import {
  matchPublishersByName,
  importPublisherFlags,
  importAssignmentHistory,
  importWeeklySchemas,
} from '@/data/migration';
import type {
  ParsedExcel,
  MatchResult,
  MigrationReport,
  PublisherMatch,
} from '@/lib/migration/types';

// ─── Parse Excel ─────────────────────────────────────────────────────

export async function parseExcelAction(
  formData: FormData
): Promise<
  { success: true; data: ParsedExcel } | { success: false; error: string }
> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return { success: false, error: 'File must be an Excel file (.xlsx)' };
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseExcelFile(buffer);

    return { success: true, data: parsed };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse file',
    };
  }
}

// ─── Match Publishers ────────────────────────────────────────────────

export async function matchPublishersAction(
  inscritosJson: string
): Promise<
  { success: true; data: MatchResult } | { success: false; error: string }
> {
  try {
    const inscritos = JSON.parse(inscritosJson);
    const result = await matchPublishersByName(inscritos);
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to match publishers',
    };
  }
}

// ─── Import Publisher Flags ──────────────────────────────────────────

export async function importFlagsAction(
  inscritosJson: string,
  matchesJson: string
): Promise<
  { success: true; data: MigrationReport } | { success: false; error: string }
> {
  try {
    const inscritos = JSON.parse(inscritosJson);
    const matches: PublisherMatch[] = JSON.parse(matchesJson);
    const report = await importPublisherFlags(inscritos, matches);
    return { success: true, data: report };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to import publisher flags',
    };
  }
}

// ─── Import Assignment History ───────────────────────────────────────

export async function importHistoryAction(
  historicoJson: string
): Promise<
  { success: true; data: MigrationReport } | { success: false; error: string }
> {
  try {
    const historico = JSON.parse(historicoJson);
    const report = await importAssignmentHistory(historico);
    return { success: true, data: report };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to import assignment history',
    };
  }
}

// ─── Import Weekly Schemas ───────────────────────────────────────────

export async function importWeeksAction(
  variablesJson: string
): Promise<
  { success: true; data: MigrationReport } | { success: false; error: string }
> {
  try {
    const variables = JSON.parse(variablesJson);
    const report = await importWeeklySchemas(variables);
    return { success: true, data: report };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to import weekly schemas',
    };
  }
}
