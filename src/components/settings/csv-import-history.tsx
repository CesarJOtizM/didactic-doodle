'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  parseHistoryCsvAction,
  importHistoryAction,
  downloadHistoryCsvTemplateAction,
} from '@/app/[locale]/(protected)/settings/import-actions';
import type {
  ParsedHistoryRow,
  HistoryParseResult,
  HistoryImportResult,
} from '@/app/[locale]/(protected)/settings/import-actions';

// ─── Human-readable value maps ────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  OPENING: 'Apertura',
  TREASURES: 'Tesoros',
  MINISTRY_SCHOOL: 'Seamos mejores maestros',
  CHRISTIAN_LIFE: 'Nuestra vida cristiana',
  CLOSING: 'Cierre',
};

const PART_TYPE_LABELS: Record<string, string> = {
  SPEECH: 'Discurso',
  DEMONSTRATION: 'Demostración',
  READING: 'Lectura',
  DISCUSSION: 'Análisis',
  STUDY: 'Estudio',
  PRAYER: 'Oración',
  SONG: 'Canción',
};

const ROOM_LABELS: Record<string, string> = {
  MAIN: 'Principal',
  AUXILIARY_1: 'Auxiliar',
};

// ─── Date formatter ───────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ─── Component ────────────────────────────────────────────────────────

export function CsvImportHistory() {
  const t = useTranslations('settings.import');

  const [parseResult, setParseResult] = useState<HistoryParseResult | null>(
    null
  );
  const [importResult, setImportResult] = useState<HistoryImportResult | null>(
    null
  );
  const [parseStatus, setParseStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [importStatus, setImportStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Template download ────────────────────────────────────────

  async function handleDownloadTemplate() {
    const csv = await downloadHistoryCsvTemplateAction();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-historial.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ─── File upload ──────────────────────────────────────────────

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError(t('errors.invalidFileType'));
      return;
    }

    setParseStatus('loading');
    setError(null);
    setParseResult(null);
    setImportResult(null);
    setImportStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    const result = await parseHistoryCsvAction(formData);

    if (result.success) {
      setParseResult(result.data);
      setParseStatus('success');
    } else {
      setError(result.error);
      setParseStatus('error');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ─── Drag and drop ────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Import ───────────────────────────────────────────────────

  async function handleImport() {
    if (!parseResult || parseResult.valid.length === 0) return;

    setImportStatus('loading');

    const result = await importHistoryAction(parseResult.valid);
    setImportResult(result);
    setImportStatus(result.errors.length > 0 ? 'error' : 'success');
  }

  // ─── Reset ────────────────────────────────────────────────────

  function handleReset() {
    setParseResult(null);
    setImportResult(null);
    setParseStatus('idle');
    setImportStatus('idle');
    setError(null);
  }

  // ─── Computed values ──────────────────────────────────────────

  const validCount = parseResult?.valid.length ?? 0;
  const errorCount = parseResult?.errors.length ?? 0;
  const duplicateCount = parseResult?.duplicatesInCsv.length ?? 0;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('history.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('history.description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="size-4" data-icon="inline-start" />
          {t('history.downloadTemplate')}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload area */}
      {!parseResult && !importResult && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            parseStatus === 'loading' && 'pointer-events-none opacity-50'
          )}
        >
          {parseStatus === 'loading' ? (
            <>
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('history.parsing')}
              </p>
            </>
          ) : (
            <>
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <FileSpreadsheet className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {t('history.dropzone.title')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('history.dropzone.subtitle')}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" data-icon="inline-start" />
                {t('history.dropzone.button')}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Preview — shown after parse */}
      {parseResult && !importResult && (
        <>
          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            {validCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                {t('history.summary.valid', { count: validCount })}
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="size-3" />
                {t('history.summary.errors', { count: errorCount })}
              </Badge>
            )}
            {duplicateCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="size-3 text-amber-500" />
                {t('history.summary.duplicates', { count: duplicateCount })}
              </Badge>
            )}
          </div>

          {/* Error details */}
          {errorCount > 0 && (
            <details className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20">
              <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300">
                {t('history.errorDetails', { count: errorCount })}
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pl-4 text-xs">
                {parseResult.errors.map((err, i) => (
                  <li key={i} className="text-red-600 dark:text-red-400">
                    {t('history.errorRow', {
                      row: err.row,
                      field: err.field,
                      message: err.message,
                    })}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Duplicate warnings */}
          {duplicateCount > 0 && (
            <details className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <summary className="cursor-pointer text-sm font-medium text-amber-700 dark:text-amber-300">
                {t('history.duplicateDetails', { count: duplicateCount })}
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pl-4 text-xs">
                {parseResult.duplicatesInCsv.map((dup, i) => (
                  <li key={i} className="text-amber-600 dark:text-amber-400">
                    {dup}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Preview table (desktop) */}
          {validCount > 0 && (
            <div className="hidden sm:block">
              <HistoryPreviewTable records={parseResult.valid} />
            </div>
          )}

          {/* Preview cards (mobile) */}
          {validCount > 0 && (
            <div className="grid gap-2 sm:hidden">
              {parseResult.valid.map((record, i) => (
                <MobileHistoryCard key={i} record={record} />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleReset}>
              {t('history.cancel')}
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0 || importStatus === 'loading'}
            >
              {importStatus === 'loading' ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    data-icon="inline-start"
                  />
                  {t('history.importing')}
                </>
              ) : (
                <>
                  <History className="size-4" data-icon="inline-start" />
                  {t('history.importButton', { count: validCount })}
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Import result */}
      {importResult && (
        <div className="space-y-4">
          <div
            className={cn(
              'rounded-lg border p-4',
              importResult.errors.length > 0
                ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
            )}
          >
            <div className="flex items-start gap-3">
              {importResult.errors.length > 0 ? (
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {t('history.result.title')}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('history.result.created', {
                      count: importResult.created,
                    })}
                  </span>
                  {importResult.errors.length > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      {t('history.result.errors', {
                        count: importResult.errors.length,
                      })}
                    </span>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-red-600 dark:text-red-400">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-muted-foreground">
                        ...{' '}
                        {t('history.result.moreErrors', {
                          count: importResult.errors.length - 10,
                        })}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleReset}>
              {t('history.importAnother')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History Preview Table ────────────────────────────────────────────

function HistoryPreviewTable({ records }: { records: ParsedHistoryRow[] }) {
  const t = useTranslations('settings.import.history');

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-card">
              {t('table.fecha')}
            </TableHead>
            <TableHead>{t('table.seccion')}</TableHead>
            <TableHead>{t('table.tipo')}</TableHead>
            <TableHead>{t('table.titulo')}</TableHead>
            <TableHead>{t('table.sala')}</TableHead>
            <TableHead>{t('table.publicador')}</TableHead>
            <TableHead>{t('table.ayudante')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, i) => (
            <TableRow key={i}>
              <TableCell className="sticky left-0 z-10 bg-inherit font-medium whitespace-nowrap">
                {formatDate(record.fecha)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {SECTION_LABELS[record.seccion] ?? record.seccion}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {PART_TYPE_LABELS[record.tipo] ?? record.tipo}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {record.titulo ?? '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {ROOM_LABELS[record.sala] ?? record.sala}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {record.publisherNombre}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {record.helperNombre ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Mobile History Card ──────────────────────────────────────────────

function MobileHistoryCard({ record }: { record: ParsedHistoryRow }) {
  const t = useTranslations('settings.import.history');

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {record.publisherNombre}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(record.fecha)} &middot;{' '}
            {SECTION_LABELS[record.seccion] ?? record.seccion}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {PART_TYPE_LABELS[record.tipo] ?? record.tipo}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs">
          {ROOM_LABELS[record.sala] ?? record.sala}
        </Badge>
        {record.titulo && (
          <span className="truncate text-xs text-muted-foreground">
            {record.titulo}
          </span>
        )}
      </div>
      {record.helperNombre && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t('table.ayudante')}: {record.helperNombre}
        </p>
      )}
    </div>
  );
}
