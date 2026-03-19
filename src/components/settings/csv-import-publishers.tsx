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
  Check,
  X,
  Users,
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  parsePublishersCsvAction,
  importPublishersAction,
  downloadPublishersCsvTemplateAction,
} from '@/app/[locale]/(protected)/settings/import-actions';
import type {
  ParsedPublisher,
  CsvParseResult,
  ImportResult,
} from '@/app/[locale]/(protected)/settings/import-actions';

// ─── Human-readable value maps ────────────────────────────────────────

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
};

const ROLE_LABELS: Record<string, string> = {
  ELDER: 'Anciano',
  MINISTERIAL_SERVANT: 'Siervo ministerial',
  BAPTIZED_PUBLISHER: 'Pub. bautizado',
  UNBAPTIZED_PUBLISHER: 'Pub. no bautizado',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  ABSENT: 'Ausente',
  RESTRICTED: 'Restringido',
  INACTIVE: 'Inactivo',
};

// ─── Component ────────────────────────────────────────────────────────

export function CsvImportPublishers() {
  const t = useTranslations('settings.import');

  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
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
    const csv = await downloadPublishersCsvTemplateAction();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-publicadores.csv';
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

    const result = await parsePublishersCsvAction(formData);

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
    // Reset input so the same file can be re-selected
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

    // Filter out publishers that already exist in DB
    const toImport = parseResult.valid.filter(
      (pub) =>
        !parseResult.existingInDb
          .map((n) => n.trim().toLowerCase())
          .includes(pub.nombre.trim().toLowerCase())
    );

    if (toImport.length === 0) {
      setImportResult({
        created: 0,
        skipped: parseResult.valid.length,
        errors: [],
      });
      setImportStatus('success');
      return;
    }

    setImportStatus('loading');

    const result = await importPublishersAction(toImport);
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

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('publishers.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('publishers.description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="size-4" data-icon="inline-start" />
          {t('publishers.downloadTemplate')}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload area — shown when no parse result yet or after reset */}
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
                {t('publishers.parsing')}
              </p>
            </>
          ) : (
            <>
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <FileSpreadsheet className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {t('publishers.dropzone.title')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('publishers.dropzone.subtitle')}
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
                {t('publishers.dropzone.button')}
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
                {t('publishers.summary.valid', { count: validCount })}
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="size-3" />
                {t('publishers.summary.errors', { count: errorCount })}
              </Badge>
            )}
            {existingCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="size-3 text-amber-500" />
                {t('publishers.summary.existing', { count: existingCount })}
              </Badge>
            )}
          </div>

          {/* Error details */}
          {errorCount > 0 && (
            <details className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20">
              <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300">
                {t('publishers.errorDetails', { count: errorCount })}
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pl-4 text-xs">
                {parseResult.errors.map((err, i) => (
                  <li key={i} className="text-red-600 dark:text-red-400">
                    {t('publishers.errorRow', {
                      row: err.row,
                      field: err.field,
                      message: err.message,
                    })}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Existing in DB warning */}
          {existingCount > 0 && (
            <details className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <summary className="cursor-pointer text-sm font-medium text-amber-700 dark:text-amber-300">
                {t('publishers.existingDetails', { count: existingCount })}
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pl-4 text-xs">
                {parseResult.existingInDb.map((name, i) => (
                  <li key={i} className="text-amber-600 dark:text-amber-400">
                    {name}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Preview table (desktop) */}
          {validCount > 0 && (
            <div className="hidden sm:block">
              <PreviewTable
                publishers={parseResult.valid}
                existingNames={parseResult.existingInDb}
              />
            </div>
          )}

          {/* Preview cards (mobile) */}
          {validCount > 0 && (
            <div className="grid gap-2 sm:hidden">
              {parseResult.valid.map((pub, i) => {
                const isExisting = parseResult.existingInDb
                  .map((n) => n.trim().toLowerCase())
                  .includes(pub.nombre.trim().toLowerCase());

                return (
                  <MobilePreviewCard
                    key={i}
                    publisher={pub}
                    isExisting={isExisting}
                  />
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleReset}>
              {t('publishers.cancel')}
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
                  {t('publishers.importing')}
                </>
              ) : (
                <>
                  <Users className="size-4" data-icon="inline-start" />
                  {t('publishers.importButton', { count: importableCount })}
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
                  {t('publishers.result.title')}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('publishers.result.created', {
                      count: importResult.created,
                    })}
                  </span>
                  {importResult.skipped > 0 && (
                    <span className="text-muted-foreground">
                      {t('publishers.result.skipped', {
                        count: importResult.skipped,
                      })}
                    </span>
                  )}
                  {importResult.errors.length > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      {t('publishers.result.errors', {
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
                        {t('publishers.result.moreErrors', {
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
              {t('publishers.importAnother')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview Table ────────────────────────────────────────────────────

function PreviewTable({
  publishers,
  existingNames,
}: {
  publishers: ParsedPublisher[];
  existingNames: string[];
}) {
  const t = useTranslations('settings.import.publishers');
  const existingSet = new Set(existingNames.map((n) => n.trim().toLowerCase()));

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-card">
              {t('table.nombre')}
            </TableHead>
            <TableHead>{t('table.sexo')}</TableHead>
            <TableHead>{t('table.rol')}</TableHead>
            <TableHead>{t('table.estado')}</TableHead>
            <TableHead className="text-center">{t('table.vmc')}</TableHead>
            <TableHead className="text-center">{t('table.oracion')}</TableHead>
            <TableHead className="text-center">{t('table.lectura')}</TableHead>
            <TableHead className="text-center">
              {t('table.acomodador')}
            </TableHead>
            <TableHead className="text-center">
              {t('table.microfono')}
            </TableHead>
            <TableHead className="text-center">
              {t('table.presidencia')}
            </TableHead>
            <TableHead className="text-center">{t('table.atalaya')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publishers.map((pub, i) => {
            const isExisting = existingSet.has(pub.nombre.trim().toLowerCase());

            return (
              <TableRow
                key={i}
                className={cn(
                  isExisting && 'bg-amber-50/50 dark:bg-amber-950/10'
                )}
              >
                <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
                  <div className="flex items-center gap-1.5">
                    {pub.nombre}
                    {isExisting && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="size-3.5 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>{t('table.existsInDb')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell>{GENDER_LABELS[pub.sexo]}</TableCell>
                <TableCell>{ROLE_LABELS[pub.rol]}</TableCell>
                <TableCell>{STATUS_LABELS[pub.estado]}</TableCell>
                <TableCell className="text-center">
                  <BoolIcon value={pub.habilitadoVMC} />
                </TableCell>
                <TableCell className="text-center">
                  <BoolIcon value={pub.habilitadoOracion} />
                </TableCell>
                <TableCell className="text-center">
                  <BoolIcon value={pub.habilitadoLectura} />
                </TableCell>
                <TableCell className="text-center">
                  <BoolIcon value={pub.habilitadoAcomodador} />
                </TableCell>
                <TableCell className="text-center">
                  <BoolIcon value={pub.habilitadoMicrofono} />
                </TableCell>
                <TableCell className="text-center">
                  <BoolIcon value={pub.habilitadoPresidenciaFinDeSemana} />
                </TableCell>
                <TableCell className="text-center">
                  <BoolIcon value={pub.habilitadoConductorAtalaya} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}

// ─── Mobile Preview Card ──────────────────────────────────────────────

function MobilePreviewCard({
  publisher: pub,
  isExisting,
}: {
  publisher: ParsedPublisher;
  isExisting: boolean;
}) {
  const t = useTranslations('settings.import.publishers');

  const flags = [
    { label: 'VMC', value: pub.habilitadoVMC },
    { label: t('table.oracion'), value: pub.habilitadoOracion },
    { label: t('table.lectura'), value: pub.habilitadoLectura },
    { label: t('table.acomodador'), value: pub.habilitadoAcomodador },
    { label: t('table.microfono'), value: pub.habilitadoMicrofono },
    {
      label: t('table.presidencia'),
      value: pub.habilitadoPresidenciaFinDeSemana,
    },
    { label: t('table.atalaya'), value: pub.habilitadoConductorAtalaya },
  ];

  const enabledFlags = flags.filter((f) => f.value);

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isExisting
          ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10'
          : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{pub.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {GENDER_LABELS[pub.sexo]} &middot; {ROLE_LABELS[pub.rol]} &middot;{' '}
            {STATUS_LABELS[pub.estado]}
          </p>
        </div>
        {isExisting && (
          <Badge
            variant="outline"
            className="shrink-0 gap-1 text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle className="size-3" />
            {t('table.exists')}
          </Badge>
        )}
      </div>
      {enabledFlags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {enabledFlags.map((flag) => (
            <Badge key={flag.label} variant="secondary" className="text-xs">
              {flag.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Boolean Icon ─────────────────────────────────────────────────────

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="mx-auto size-4 text-emerald-500" />
  ) : (
    <X className="mx-auto size-4 text-muted-foreground/30" />
  );
}
