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
  Calendar,
  Music,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  parseWeeksCsvAction,
  importWeeksAction,
  downloadWeeksCsvTemplateAction,
} from '@/app/[locale]/(protected)/settings/import-actions';
import type {
  ParsedWeek,
  WeeksParseResult,
  WeeksImportResult,
  CsvRowError,
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

const SECTION_ORDER: Record<string, number> = {
  OPENING: 0,
  TREASURES: 1,
  MINISTRY_SCHOOL: 2,
  CHRISTIAN_LIFE: 3,
  CLOSING: 4,
};

const SECTION_COLORS: Record<string, string> = {
  OPENING: 'text-slate-600 dark:text-slate-400',
  TREASURES: 'text-amber-700 dark:text-amber-400',
  MINISTRY_SCHOOL: 'text-yellow-700 dark:text-yellow-400',
  CHRISTIAN_LIFE: 'text-red-700 dark:text-red-400',
  CLOSING: 'text-slate-600 dark:text-slate-400',
};

// ─── Component ────────────────────────────────────────────────────────

export function CsvImportWeeks() {
  const t = useTranslations('settings.import');

  const [parseResult, setParseResult] = useState<WeeksParseResult | null>(null);
  const [importResult, setImportResult] = useState<WeeksImportResult | null>(
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
    const csv = await downloadWeeksCsvTemplateAction();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-semanas.csv';
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

    const result = await parseWeeksCsvAction(formData);

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

    // Filter out weeks that already exist in DB
    const existingSet = new Set(
      parseResult.existingInDb.map((d) => d.trim().toLowerCase())
    );
    const toImport = parseResult.valid.filter(
      (week) => !existingSet.has(week.fechaInicioStr.trim().toLowerCase())
    );

    if (toImport.length === 0) {
      setImportResult({
        weeksCreated: 0,
        partsCreated: 0,
        assignmentsCreated: 0,
        skipped: parseResult.valid.length,
        errors: [],
      });
      setImportStatus('success');
      return;
    }

    setImportStatus('loading');

    const result = await importWeeksAction(toImport);
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
  const existingCount = parseResult?.existingInDb.length ?? 0;
  const importableCount = validCount - existingCount;
  const totalParts =
    parseResult?.valid.reduce((sum, w) => sum + w.parts.length, 0) ?? 0;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('weeks.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('weeks.description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="size-4" data-icon="inline-start" />
          {t('weeks.downloadTemplate')}
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
                {t('weeks.parsing')}
              </p>
            </>
          ) : (
            <>
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <FileSpreadsheet className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {t('weeks.dropzone.title')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('weeks.dropzone.subtitle')}
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
                {t('weeks.dropzone.button')}
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
                {t('weeks.summary.valid', { count: validCount })}
              </Badge>
            )}
            {totalParts > 0 && (
              <Badge variant="secondary" className="gap-1">
                {t('weeks.summary.parts', { count: totalParts })}
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="size-3" />
                {t('weeks.summary.errors', { count: errorCount })}
              </Badge>
            )}
            {existingCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="size-3 text-amber-500" />
                {t('weeks.summary.existing', { count: existingCount })}
              </Badge>
            )}
          </div>

          {/* Error details */}
          {errorCount > 0 && (
            <ErrorDetails errors={parseResult.errors} errorCount={errorCount} />
          )}

          {/* Existing in DB warning */}
          {existingCount > 0 && (
            <details className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <summary className="cursor-pointer text-sm font-medium text-amber-700 dark:text-amber-300">
                {t('weeks.existingDetails', { count: existingCount })}
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pl-4 text-xs">
                {parseResult.existingInDb.map((date, i) => (
                  <li key={i} className="text-amber-600 dark:text-amber-400">
                    {date}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Week cards preview */}
          {validCount > 0 && (
            <div className="space-y-4">
              {parseResult.valid.map((week, i) => {
                const isExisting = parseResult.existingInDb.includes(
                  week.fechaInicioStr
                );
                return (
                  <WeekPreviewCard
                    key={i}
                    week={week}
                    isExisting={isExisting}
                  />
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleReset}>
              {t('weeks.cancel')}
            </Button>
            <Button
              onClick={handleImport}
              disabled={importableCount === 0 || importStatus === 'loading'}
            >
              {importStatus === 'loading' ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    data-icon="inline-start"
                  />
                  {t('weeks.importing')}
                </>
              ) : (
                <>
                  <Calendar className="size-4" data-icon="inline-start" />
                  {t('weeks.importButton', { count: importableCount })}
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
                <p className="text-sm font-medium">{t('weeks.result.title')}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('weeks.result.weeksCreated', {
                      count: importResult.weeksCreated,
                    })}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('weeks.result.partsCreated', {
                      count: importResult.partsCreated,
                    })}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('weeks.result.assignmentsCreated', {
                      count: importResult.assignmentsCreated,
                    })}
                  </span>
                  {importResult.skipped > 0 && (
                    <span className="text-muted-foreground">
                      {t('weeks.result.skipped', {
                        count: importResult.skipped,
                      })}
                    </span>
                  )}
                  {importResult.errors.length > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      {t('weeks.result.errors', {
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
                        {t('weeks.result.moreErrors', {
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
              {t('weeks.importAnother')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Week Preview Card ────────────────────────────────────────────────

function WeekPreviewCard({
  week,
  isExisting,
}: {
  week: ParsedWeek;
  isExisting: boolean;
}) {
  const t = useTranslations('settings.import.weeks');
  const [expanded, setExpanded] = useState(true);

  // Format date range
  const fechaFin = new Date(week.fechaInicio);
  fechaFin.setDate(fechaFin.getDate() + 6);
  const startStr = formatDateShort(week.fechaInicio);
  const endStr = formatDateShort(fechaFin);

  // Group parts by section for display
  const partsBySection = groupPartsBySection(week.parts);

  return (
    <Card
      size="sm"
      className={cn(
        isExisting &&
          'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/10'
      )}
    >
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {startStr} &ndash; {endStr}
              </span>
              {isExisting && (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 text-amber-600 dark:text-amber-400"
                >
                  <AlertTriangle className="size-3" />
                  {t('exists')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="size-3" />
                {week.lecturaSemanal}
              </span>
              <span className="inline-flex items-center gap-1">
                <Music className="size-3" />
                {week.cancionApertura}, {week.cancionIntermedia},{' '}
                {week.cancionCierre}
              </span>
              <Badge variant="secondary" className="text-xs">
                {t('partCount', { count: week.parts.length })}
              </Badge>
              {week.salaAuxiliarActiva && (
                <Badge variant="secondary" className="text-xs">
                  {t('auxRoom')}
                </Badge>
              )}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 size-8 p-0">
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {Object.entries(partsBySection)
              .sort(
                ([a], [b]) =>
                  (SECTION_ORDER[a] ?? 99) - (SECTION_ORDER[b] ?? 99)
              )
              .map(([section, parts]) => (
                <div key={section}>
                  <p
                    className={cn(
                      'mb-1 text-xs font-semibold uppercase tracking-wider',
                      SECTION_COLORS[section] ?? 'text-muted-foreground'
                    )}
                  >
                    {SECTION_LABELS[section] ?? section}
                  </p>
                  <div className="space-y-1">
                    {parts.map((part, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
                      >
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px]"
                        >
                          {PART_TYPE_LABELS[part.tipo] ?? part.tipo}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          {part.titulo || '\u2014'}
                        </span>
                        {part.duracion && (
                          <span className="shrink-0 text-muted-foreground">
                            {part.duracion} min
                          </span>
                        )}
                        {part.publicadorNombre && (
                          <span className="shrink-0 font-medium">
                            {part.publicadorNombre}
                          </span>
                        )}
                        {part.ayudanteNombre && (
                          <span className="shrink-0 text-muted-foreground">
                            + {part.ayudanteNombre}
                          </span>
                        )}
                        {part.sala === 'AUXILIARY_1' && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px]"
                          >
                            Aux
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Error Details ────────────────────────────────────────────────────

function ErrorDetails({
  errors,
  errorCount,
}: {
  errors: CsvRowError[];
  errorCount: number;
}) {
  const t = useTranslations('settings.import.weeks');

  return (
    <details className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20">
      <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300">
        {t('errorDetails', { count: errorCount })}
      </summary>
      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pl-4 text-xs">
        {errors.map((err, i) => (
          <li key={i} className="text-red-600 dark:text-red-400">
            {t('errorRow', {
              row: err.row,
              field: err.field,
              message: err.message,
            })}
          </li>
        ))}
      </ul>
    </details>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDateShort(date: Date): string {
  const d = date.getDate();
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const m = months[date.getMonth()];
  return `${d} ${m}`;
}

function groupPartsBySection(
  parts: ParsedWeek['parts']
): Record<string, ParsedWeek['parts']> {
  const groups: Record<string, ParsedWeek['parts']> = {};
  for (const part of parts) {
    if (!groups[part.seccion]) {
      groups[part.seccion] = [];
    }
    groups[part.seccion].push(part);
  }
  // Sort parts within each section by orden
  for (const section of Object.keys(groups)) {
    groups[section].sort((a, b) => a.orden - b.orden);
  }
  return groups;
}
