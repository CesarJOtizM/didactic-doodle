'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
import { duplicateWeekAction } from '@/app/[locale]/(protected)/weeks/actions';
import { LoaderIcon } from 'lucide-react';

type WeekDuplicateDialogProps = {
  sourceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WeekDuplicateDialog({
  sourceId,
  open,
  onOpenChange,
}: WeekDuplicateDialogProps) {
  const t = useTranslations('meetings');
  const tc = useTranslations('common');
  const [isPending, startTransition] = useTransition();
  const [fechaInicio, setFechaInicio] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!sourceId) return null;

  const handleDuplicate = () => {
    if (!fechaInicio) return;
    setError(null);

    startTransition(async () => {
      const result = await duplicateWeekAction(sourceId, fechaInicio);
      if (result.success) {
        setFechaInicio('');
        toast.success('Semana duplicada exitosamente');
        onOpenChange(false);
      } else {
        setError(result.error);
        toast.error(result.error ?? 'Error al duplicar semana');
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setFechaInicio('');
          setError(null);
        }
        onOpenChange(val);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('actions.duplicate')}</DialogTitle>
          <DialogDescription>{t('fields.startDate')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="newFechaInicio" className="text-sm font-medium">
              {t('fields.startDate')} *
            </label>
            <Input
              id="newFechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {tc('cancel')}
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={isPending || !fechaInicio}
          >
            {isPending && (
              <LoaderIcon
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
            )}
            {t('actions.duplicate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
