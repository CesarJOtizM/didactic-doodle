'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';

export function PrintButton() {
  const t = useTranslations('meetings.print');

  return (
    <Button onClick={() => window.print()} className="no-print">
      <PrinterIcon className="size-4" data-icon="inline-start" />
      {t('printButton')}
    </Button>
  );
}
