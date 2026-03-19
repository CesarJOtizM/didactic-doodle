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
import { deletePublisherAction } from '@/app/[locale]/(protected)/publishers/actions';
import type { Publisher } from '@/generated/prisma/client';
import { LoaderIcon, AlertTriangleIcon } from 'lucide-react';

type PublisherDeleteDialogProps = {
  publisher: Publisher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PublisherDeleteDialog({
  publisher,
  open,
  onOpenChange,
}: PublisherDeleteDialogProps) {
  const t = useTranslations('publishers');
  const tc = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  if (!publisher) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePublisherAction(publisher.id);
      if (result.success) {
        toast.success('Publicador eliminado');
        onOpenChange(false);
      } else {
        toast.error(result.error ?? 'Error al eliminar publicador');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangleIcon className="size-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">
            {t('confirm.deleteTitle')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('confirm.deleteMessage', { name: publisher.nombre })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-center text-sm text-amber-800 dark:text-amber-200">
            {t('confirm.deleteWarning')}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 sm:flex-initial"
          >
            {tc('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 sm:flex-initial"
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
