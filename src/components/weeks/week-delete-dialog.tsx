'use client';

import { useTransition } from 'react';
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
import { deleteWeekAction } from '@/app/[locale]/(protected)/weeks/actions';
import { LoaderIcon } from 'lucide-react';

type WeekDeleteDialogProps = {
  weekId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WeekDeleteDialog({
  weekId,
  open,
  onOpenChange,
}: WeekDeleteDialogProps) {
  const t = useTranslations('meetings');
  const tc = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  if (!weekId) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteWeekAction(weekId);
      if (result.success) {
        toast.success('Semana eliminada');
        onOpenChange(false);
      } else {
        toast.error(result.error ?? 'Error al eliminar la semana');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('confirm.deleteWeek')}</DialogTitle>
          <DialogDescription>{t('confirm.deleteWarning')}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {tc('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && (
              <LoaderIcon
                className="size-4 animate-spin"
                data-icon="inline-start"
              />
            )}
            {tc('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
