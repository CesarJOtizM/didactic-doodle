'use client';

import { useTransition } from 'react';
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
import { LoaderIcon } from 'lucide-react';

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
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('confirm.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('confirm.deleteMessage', { name: publisher.nombre })}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t('confirm.deleteWarning')}
        </p>

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
