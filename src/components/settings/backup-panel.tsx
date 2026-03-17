'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackupPanel() {
  const t = useTranslations('settings.backup');

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Download ──────────────────────────────────────────────────

  function handleDownload() {
    const link = document.createElement('a');
    link.href = '/api/backup';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ─── Upload / Restore ─────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Confirm before proceeding
    if (!window.confirm(t('upload.confirm'))) {
      // Reset file input
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      {/* Download Section */}
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium">{t('download.title')}</h3>
        <p className="text-muted-foreground mb-3 text-xs">
          {t('download.description')}
        </p>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 size-4" />
          {t('download.button')}
        </Button>
      </div>

      {/* Upload Section */}
      <div className="rounded-lg border border-red-200 p-4 dark:border-red-800">
        <h3 className="text-sm font-medium">{t('upload.title')}</h3>
        <p className="text-muted-foreground mb-3 text-xs">
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
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t('upload.uploading')}
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              {t('upload.button')}
            </>
          )}
        </Button>

        {uploadResult && (
          <div
            className={`mt-3 flex items-center gap-2 text-sm ${
              uploadResult.success
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {uploadResult.success ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {uploadResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
