'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PublisherFilters } from '@/components/publishers/publisher-filters';
import { PublisherPagination } from '@/components/publishers/publisher-pagination';
import { PublisherStatusBadge } from '@/components/publishers/publisher-status-badge';
import { PublisherForm } from '@/components/publishers/publisher-form';
import { PublisherDeleteDialog } from '@/components/publishers/publisher-delete-dialog';
import {
  reactivatePublisherAction,
  changeStatusAction,
} from '@/app/[locale]/(protected)/publishers/actions';
import type { PublisherWithMeta } from '@/data/publishers';
import type { PublisherFilters as PublisherFiltersType } from '@/lib/schemas/publisher';
import { PublisherStatus } from '@/generated/prisma/enums';
import {
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  RotateCcwIcon,
  EyeIcon,
  CheckCircleIcon,
} from 'lucide-react';

type PublisherListProps = {
  publishers: PublisherWithMeta[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: PublisherFiltersType;
};

export function PublisherList({
  publishers,
  total,
  page,
  pageSize,
  totalPages,
  filters,
}: PublisherListProps) {
  const t = useTranslations('publishers');
  const tc = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editPublisher, setEditPublisher] = useState<PublisherWithMeta | null>(
    null
  );
  const [deletePublisher, setDeletePublisher] =
    useState<PublisherWithMeta | null>(null);

  const handleCreate = () => {
    setEditPublisher(null);
    setFormOpen(true);
  };

  const handleEdit = (publisher: PublisherWithMeta) => {
    setEditPublisher(publisher);
    setFormOpen(true);
  };

  const handleReactivate = (publisher: PublisherWithMeta) => {
    startTransition(async () => {
      await reactivatePublisherAction(publisher.id);
    });
  };

  const handleStatusChange = (
    publisher: PublisherWithMeta,
    newStatus: PublisherStatus
  ) => {
    startTransition(async () => {
      await changeStatusAction(publisher.id, newStatus);
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: filters + create button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PublisherFilters filters={filters} />
        <Button onClick={handleCreate}>
          <PlusIcon className="size-4" data-icon="inline-start" />
          {t('actions.create')}
        </Button>
      </div>

      {/* Table */}
      {publishers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {total === 0 ? t('empty.noPublishers') : t('empty.noResults')}
          </p>
          {total === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('empty.noPublishersDescription')}
            </p>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.gender')}</TableHead>
              <TableHead>{t('table.role')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.vmcEnabled')}</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{t('table.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publishers.map((publisher) => (
              <TableRow
                key={publisher.id}
                className={isPending ? 'opacity-60' : ''}
              >
                <TableCell>
                  <Link
                    href={`/publishers/${publisher.id}`}
                    className="font-medium hover:underline"
                  >
                    {publisher.nombre}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {t(`gender.${publisher.sexo}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{t(`role.${publisher.rol}`)}</span>
                </TableCell>
                <TableCell>
                  <PublisherStatusBadge status={publisher.estado} />
                </TableCell>
                <TableCell>
                  {publisher.habilitadoVMC ? (
                    <CheckCircleIcon className="size-4 text-green-600" />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <RowActions
                    publisher={publisher}
                    t={t}
                    tc={tc}
                    onEdit={handleEdit}
                    onDelete={setDeletePublisher}
                    onReactivate={handleReactivate}
                    onStatusChange={handleStatusChange}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <PublisherPagination
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
      />

      {/* Create/Edit Dialog */}
      <PublisherForm
        publisher={editPublisher}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Delete Dialog */}
      <PublisherDeleteDialog
        publisher={deletePublisher}
        open={deletePublisher !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePublisher(null);
        }}
      />
    </div>
  );
}

// ─── Row Actions Dropdown ────────────────────────────────────────────

type RowActionsProps = {
  publisher: PublisherWithMeta;
  t: ReturnType<typeof useTranslations<'publishers'>>;
  tc: ReturnType<typeof useTranslations<'common'>>;
  onEdit: (publisher: PublisherWithMeta) => void;
  onDelete: (publisher: PublisherWithMeta) => void;
  onReactivate: (publisher: PublisherWithMeta) => void;
  onStatusChange: (
    publisher: PublisherWithMeta,
    newStatus: PublisherStatus
  ) => void;
};

function RowActions({
  publisher,
  t,
  tc,
  onEdit,
  onDelete,
  onReactivate,
  onStatusChange,
}: RowActionsProps) {
  const isActive = publisher.estado === PublisherStatus.ACTIVE;
  const isInactive = publisher.estado === PublisherStatus.INACTIVE;
  const isAbsent = publisher.estado === PublisherStatus.ABSENT;
  const isRestricted = publisher.estado === PublisherStatus.RESTRICTED;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">{t('table.actions')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* View Detail */}
        <DropdownMenuItem
          render={<Link href={`/publishers/${publisher.id}`} />}
        >
          <EyeIcon className="size-4" />
          {t('actions.viewDetail')}
        </DropdownMenuItem>

        {/* Edit */}
        <DropdownMenuItem onClick={() => onEdit(publisher)}>
          <PencilIcon className="size-4" />
          {tc('edit')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Status Changes */}
        {isActive && (
          <>
            <DropdownMenuItem
              onClick={() => onStatusChange(publisher, PublisherStatus.ABSENT)}
            >
              {t('status.ABSENT')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onStatusChange(publisher, PublisherStatus.RESTRICTED)
              }
            >
              {t('status.RESTRICTED')}
            </DropdownMenuItem>
          </>
        )}

        {(isAbsent || isRestricted) && (
          <DropdownMenuItem
            onClick={() => onStatusChange(publisher, PublisherStatus.ACTIVE)}
          >
            {t('status.ACTIVE')}
          </DropdownMenuItem>
        )}

        {isInactive && (
          <DropdownMenuItem onClick={() => onReactivate(publisher)}>
            <RotateCcwIcon className="size-4" />
            {t('actions.reactivate')}
          </DropdownMenuItem>
        )}

        {/* Delete (soft) — only for ACTIVE */}
        {isActive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(publisher)}
            >
              <TrashIcon className="size-4" />
              {tc('delete')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
