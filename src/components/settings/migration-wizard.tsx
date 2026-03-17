'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  Users,
  History,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  parseExcelAction,
  matchPublishersAction,
  importFlagsAction,
  importHistoryAction,
  importWeeksAction,
} from '@/app/[locale]/(protected)/settings/actions';
import type {
  ParsedExcel,
  MatchResult,
  MigrationReport,
} from '@/lib/migration/types';

type StepStatus = 'idle' | 'loading' | 'success' | 'error';

export function MigrationWizard() {
  const t = useTranslations('settings.migration');

  // State
  const [parsedData, setParsedData] = useState<ParsedExcel | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [flagsReport, setFlagsReport] = useState<MigrationReport | null>(null);
  const [historyReport, setHistoryReport] = useState<MigrationReport | null>(
    null
  );
  const [weeksReport, setWeeksReport] = useState<MigrationReport | null>(null);

  const [step1Status, setStep1Status] = useState<StepStatus>('idle');
  const [step2Status, setStep2Status] = useState<StepStatus>('idle');
  const [step3Status, setStep3Status] = useState<StepStatus>('idle');
  const [step4Status, setStep4Status] = useState<StepStatus>('idle');
  const [step5Status, setStep5Status] = useState<StepStatus>('idle');

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Step 1: Parse Excel ─────────────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep1Status('loading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await parseExcelAction(formData);

    if (result.success) {
      setParsedData(result.data);
      setStep1Status('success');
    } else {
      setError(result.error);
      setStep1Status('error');
    }
  }

  // ─── Step 2: Match Publishers ────────────────────────────────────

  async function handleMatch() {
    if (!parsedData) return;
    setStep2Status('loading');
    setError(null);

    const result = await matchPublishersAction(
      JSON.stringify(parsedData.inscritos)
    );

    if (result.success) {
      setMatchResult(result.data);
      setStep2Status('success');
    } else {
      setError(result.error);
      setStep2Status('error');
    }
  }

  // ─── Step 3: Import Flags ───────────────────────────────────────

  async function handleImportFlags() {
    if (!parsedData || !matchResult) return;
    setStep3Status('loading');
    setError(null);

    const result = await importFlagsAction(
      JSON.stringify(parsedData.inscritos),
      JSON.stringify(matchResult.matches)
    );

    if (result.success) {
      setFlagsReport(result.data);
      setStep3Status('success');
    } else {
      setError(result.error);
      setStep3Status('error');
    }
  }

  // ─── Step 4: Import History ─────────────────────────────────────

  async function handleImportHistory() {
    if (!parsedData) return;
    setStep4Status('loading');
    setError(null);

    const result = await importHistoryAction(
      JSON.stringify(parsedData.historico)
    );

    if (result.success) {
      setHistoryReport(result.data);
      setStep4Status('success');
    } else {
      setError(result.error);
      setStep4Status('error');
    }
  }

  // ─── Step 5: Import Weeks ──────────────────────────────────────

  async function handleImportWeeks() {
    if (!parsedData) return;
    setStep5Status('loading');
    setError(null);

    const result = await importWeeksAction(
      JSON.stringify(parsedData.variables)
    );

    if (result.success) {
      setWeeksReport(result.data);
      setStep5Status('success');
    } else {
      setError(result.error);
      setStep5Status('error');
    }
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      <StepCard
        icon={<FileSpreadsheet className="size-5" />}
        title={t('step1.title')}
        description={t('step1.description')}
        status={step1Status}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={step1Status === 'loading'}
        >
          {step1Status === 'loading' ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
              {t('step1.parsing')}
            </>
          ) : (
            <>
              <Upload className="size-4" data-icon="inline-start" />
              {t('step1.button')}
            </>
          )}
        </Button>
        {parsedData && (
          <p className="text-muted-foreground mt-2 text-sm">
            {t('step1.sheetCounts', {
              inscritos: parsedData.sheetCounts.inscritos,
              historico: parsedData.sheetCounts.historico,
              variables: parsedData.sheetCounts.variables,
            })}
          </p>
        )}
      </StepCard>

      {/* Step 2: Match */}
      <StepCard
        icon={<Users className="size-5" />}
        title={t('step2.title')}
        description={t('step2.description')}
        status={step2Status}
        disabled={step1Status !== 'success'}
      >
        <Button
          variant="outline"
          onClick={handleMatch}
          disabled={step1Status !== 'success' || step2Status === 'loading'}
        >
          {step2Status === 'loading' ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
              {t('step2.running')}
            </>
          ) : (
            t('step2.button')
          )}
        </Button>
        {matchResult && (
          <div className="mt-3 space-y-2">
            <p className="text-sm">
              {t('step2.result', {
                matched: matchResult.matchedCount,
                unmatched: matchResult.unmatchedCount,
              })}
            </p>
            {matchResult.unmatchedCount > 0 && (
              <details className="text-sm">
                <summary className="text-muted-foreground cursor-pointer">
                  {t('step2.unmatched')} ({matchResult.unmatchedCount})
                </summary>
                <ul className="mt-1 max-h-40 overflow-y-auto pl-4 text-xs">
                  {matchResult.matches
                    .filter((m) => m.status === 'unmatched')
                    .map((m, i) => (
                      <li
                        key={i}
                        className="text-orange-600 dark:text-orange-400"
                      >
                        {m.excelName}
                      </li>
                    ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </StepCard>

      {/* Step 3: Import Flags */}
      <StepCard
        icon={<Users className="size-5" />}
        title={t('step3.title')}
        description={t('step3.description')}
        status={step3Status}
        disabled={step2Status !== 'success'}
      >
        <Button
          variant="outline"
          onClick={handleImportFlags}
          disabled={step2Status !== 'success' || step3Status === 'loading'}
        >
          {step3Status === 'loading' ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
              {t('step3.running')}
            </>
          ) : (
            t('step3.button')
          )}
        </Button>
        {flagsReport && <ReportDisplay report={flagsReport} />}
      </StepCard>

      {/* Step 4: Import History */}
      <StepCard
        icon={<History className="size-5" />}
        title={t('step4.title')}
        description={t('step4.description')}
        status={step4Status}
        disabled={step1Status !== 'success'}
      >
        <Button
          variant="outline"
          onClick={handleImportHistory}
          disabled={step1Status !== 'success' || step4Status === 'loading'}
        >
          {step4Status === 'loading' ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
              {t('step4.running')}
            </>
          ) : (
            t('step4.button')
          )}
        </Button>
        {historyReport && <ReportDisplay report={historyReport} />}
      </StepCard>

      {/* Step 5: Import Weeks */}
      <StepCard
        icon={<CalendarDays className="size-5" />}
        title={t('step5.title')}
        description={t('step5.description')}
        status={step5Status}
        disabled={step1Status !== 'success'}
      >
        <Button
          variant="outline"
          onClick={handleImportWeeks}
          disabled={step1Status !== 'success' || step5Status === 'loading'}
        >
          {step5Status === 'loading' ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
              {t('step5.running')}
            </>
          ) : (
            t('step5.button')
          )}
        </Button>
        {weeksReport && <ReportDisplay report={weeksReport} />}
      </StepCard>
    </div>
  );
}

// ─── Step Card ─────────────────────────────────────────────────────

function StepCard({
  icon,
  title,
  description,
  status,
  disabled,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: StepStatus;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        disabled && 'pointer-events-none opacity-50',
        status === 'success' &&
          'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20',
        status === 'error' &&
          'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
        status === 'idle' && !disabled && 'border-border'
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <StatusIcon status={status} />
      </div>
      <div className="pl-12">{children}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="size-5 text-emerald-500" />;
    case 'error':
      return <XCircle className="size-5 text-destructive" />;
    case 'loading':
      return <Loader2 className="size-5 animate-spin text-primary" />;
    default:
      return null;
  }
}

// ─── Migration Report Display ────────────────────────────────────────

function ReportDisplay({ report }: { report: MigrationReport }) {
  const t = useTranslations('settings.migration.report');

  return (
    <div className="mt-3 space-y-1">
      <div className="flex gap-4 text-sm">
        <span className="text-emerald-600 dark:text-emerald-400">
          {t('imported')}: {report.imported}
        </span>
        <span className="text-muted-foreground">
          {t('skipped')}: {report.skipped}
        </span>
        {report.failed > 0 && (
          <span className="text-red-600 dark:text-red-400">
            {t('failed')}: {report.failed}
          </span>
        )}
      </div>
      {report.errors.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-red-600 dark:text-red-400">
            {t('errors')} ({report.errors.length})
          </summary>
          <ul className="mt-1 max-h-32 overflow-y-auto pl-4 text-xs">
            {report.errors.slice(0, 50).map((err, i) => (
              <li key={i} className="text-red-600 dark:text-red-400">
                {err}
              </li>
            ))}
            {report.errors.length > 50 && (
              <li className="text-muted-foreground">
                ... and {report.errors.length - 50} more
              </li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}
