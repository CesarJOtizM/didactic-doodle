'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';
import { PrintReportModal } from '@/components/attendants/print-report-modal';

export function PrintReportTrigger() {
  const t = useTranslations('attendants.printReport');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PrinterIcon className="size-4" data-icon="inline-start" />
        {t('trigger')}
      </Button>
      <PrintReportModal open={open} onOpenChange={setOpen} />
    </>
  );
}
