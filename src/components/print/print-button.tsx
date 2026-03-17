'use client';

import { useTranslations } from 'next-intl';
import { PrinterIcon } from 'lucide-react';

export function PrintButton() {
  const t = useTranslations('meetings.print');

  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      <PrinterIcon className="size-4" />
      {t('printButton')}
    </button>
  );
}
