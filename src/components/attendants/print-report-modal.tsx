'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrinterIcon } from 'lucide-react';

type PrintReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PrintReportModal({
  open,
  onOpenChange,
}: PrintReportModalProps) {
  const t = useTranslations('attendants.printReport');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const isValid = from !== '' && to !== '' && from <= to;

  const handlePrint = () => {
    if (!isValid) return;
    const url = `/${locale}/attendants/print?from=${from}&to=${to}`;
    window.open(url, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modalTitle')}</DialogTitle>
          <DialogDescription>{t('modalDescription')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label htmlFor="print-from" className="text-sm font-medium">
              {t('from')}
            </label>
            <Input
              id="print-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="print-to" className="text-sm font-medium">
              {t('to')}
            </label>
            <Input
              id="print-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onClick={handlePrint} disabled={!isValid}>
            <PrinterIcon className="size-4" data-icon="inline-start" />
            {t('print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
