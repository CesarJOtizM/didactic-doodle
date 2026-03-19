'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function BackupPanel() {
  const t = useTranslations('settings.backup');

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear DB state
  const [clearStep, setClearStep] = useState<
    'idle' | 'confirm' | 'type-confirm'
  >('idle');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // ─── Download ──────────────────────────────────────────────────

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch('/api/backup');

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || t('download.error'));
      }

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'backup-vmc.db';

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : t('download.error')
      );
    } finally {
      setDownloading(false);
    }
  }

  // ─── Upload / Restore ─────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Confirm before proceeding
    if (!window.confirm(t('upload.confirm'))) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: t('upload.success'),
        });
      } else {
        setUploadResult({
          success: false,
          message: data.error || t('upload.error'),
        });
      }
    } catch {
      setUploadResult({
        success: false,
        message: t('upload.error'),
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ─── Clear database ────────────────────────────────────────────

  function handleClearClick() {
    if (clearStep === 'idle') {
      setClearResult(null);
      setClearStep('confirm');
    }
  }

  function handleClearConfirm() {
    setClearStep('type-confirm');
    setClearConfirmText('');
  }

  function handleClearCancel() {
    setClearStep('idle');
    setClearConfirmText('');
  }

  async function handleClearExecute() {
    if (clearConfirmText !== t('clear.confirmWord')) return;

    setClearing(true);
    setClearResult(null);

    try {
      const response = await fetch('/api/backup', { method: 'DELETE' });
      const data = await response.json();

      if (response.ok) {
        setClearResult({ success: true, message: t('clear.success') });
      } else {
        setClearResult({
          success: false,
          message: data.error || t('clear.error'),
        });
      }
    } catch {
      setClearResult({ success: false, message: t('clear.error') });
    } finally {
      setClearing(false);
      setClearStep('idle');
      setClearConfirmText('');
    }
  }

  // ─── Reload page ──────────────────────────────────────────────

  function handleReload() {
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      {/* Download Section */}
      <div className="rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold">{t('download.title')}</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {t('download.description')}
        </p>
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
              {t('download.downloading')}
            </>
          ) : (
            <>
              <Download className="size-4" data-icon="inline-start" />
              {t('download.button')}
            </>
          )}
        </Button>

        {downloadError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {downloadError}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="rounded-lg border border-dashed border-destructive/50 p-5">
        <h3 className="text-sm font-semibold">{t('upload.title')}</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {t('upload.description')}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".db,.sqlite,.sqlite3"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          variant="destructive"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
              {t('upload.uploading')}
            </>
          ) : (
            <>
              <Upload className="size-4" data-icon="inline-start" />
              {t('upload.button')}
            </>
          )}
        </Button>

        {uploadResult && (
          <div
            className={cn(
              'mt-4 flex items-center gap-2 text-sm',
              uploadResult.success
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive'
            )}
          >
            {uploadResult.success ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{uploadResult.message}</span>

            {uploadResult.success && (
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={handleReload}
              >
                <RefreshCw className="size-3" data-icon="inline-start" />
                {t('upload.reload')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Clear Database Section */}
      <div className="rounded-lg border-2 border-destructive/50 bg-destructive/5 p-5">
        <h3 className="text-sm font-semibold text-destructive">
          {t('clear.title')}
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('clear.description')}
        </p>
        <p className="mb-4 text-xs font-semibold text-destructive">
          {t('clear.warning')}
        </p>

        {/* Step 1: Initial button */}
        {clearStep === 'idle' && (
          <Button
            variant="destructive"
            onClick={handleClearClick}
            disabled={clearing}
          >
            <Trash2 className="size-4" data-icon="inline-start" />
            {t('clear.button')}
          </Button>
        )}

        {/* Step 2: First confirmation */}
        {clearStep === 'confirm' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              {t('clear.confirm')}
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleClearConfirm}>
                {t('clear.button')}
              </Button>
              <Button variant="outline" onClick={handleClearCancel}>
                {t('clear.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Type to confirm */}
        {clearStep === 'type-confirm' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              {t('clear.typeToConfirm')}
            </p>
            <div className="flex gap-2">
              <Input
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                placeholder={t('clear.confirmWord')}
                className="max-w-48 border-destructive/50 font-mono uppercase"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleClearExecute();
                  if (e.key === 'Escape') handleClearCancel();
                }}
              />
              <Button
                variant="destructive"
                onClick={handleClearExecute}
                disabled={
                  clearing || clearConfirmText !== t('clear.confirmWord')
                }
              >
                {clearing ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      data-icon="inline-start"
                    />
                    {t('clear.clearing')}
                  </>
                ) : (
                  t('clear.button')
                )}
              </Button>
              <Button variant="outline" onClick={handleClearCancel}>
                {t('clear.cancel')}
              </Button>
            </div>
          </div>
        )}

        {clearResult && (
          <div
            className={cn(
              'mt-4 flex items-center gap-2 text-sm',
              clearResult.success
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive'
            )}
          >
            {clearResult.success ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{clearResult.message}</span>

            {clearResult.success && (
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={handleReload}
              >
                <RefreshCw className="size-3" data-icon="inline-start" />
                {t('clear.reload')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
