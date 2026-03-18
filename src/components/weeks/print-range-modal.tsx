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

type PrintRangeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PrintRangeModal({ open, onOpenChange }: PrintRangeModalProps) {
  const t = useTranslations('meetings.print');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [meetingType, setMeetingType] = useState<'midweek' | 'weekend'>(
    'midweek'
  );

  const canPrint = from !== '' && to !== '' && from <= to;

  const handlePrint = () => {
    if (!canPrint) return;
    const url = `/${locale}/weeks/print/s140?from=${from}&to=${to}&type=${meetingType}`;
    window.open(url, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('printRange')}</DialogTitle>
          <DialogDescription>{t('printRangeDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="print-from"
                className="text-sm font-medium text-foreground"
              >
                {t('dateFrom')}
              </label>
              <Input
                id="print-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="print-to"
                className="text-sm font-medium text-foreground"
              >
                {t('dateTo')}
              </label>
              <Input
                id="print-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* Meeting type */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              {t('meetingType')}
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="meetingType"
                  value="midweek"
                  checked={meetingType === 'midweek'}
                  onChange={() => setMeetingType('midweek')}
                  className="accent-primary"
                />
                {t('typeMidweek')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="meetingType"
                  value="weekend"
                  checked={meetingType === 'weekend'}
                  onChange={() => setMeetingType('weekend')}
                  className="accent-primary"
                />
                {t('typeWeekend')}
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onClick={handlePrint} disabled={!canPrint}>
            <PrinterIcon className="size-4" data-icon="inline-start" />
            {t('openPrintView')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
