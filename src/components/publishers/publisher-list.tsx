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
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  RotateCcwIcon,
  EyeIcon,
  CheckCircleIcon,
  UsersIcon,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <PublisherFilters filters={filters} />
        </div>
        <Button onClick={handleCreate} className="h-10 shrink-0">
          <PlusIcon className="size-4" data-icon="inline-start" />
          {t('actions.create')}
        </Button>
      </div>

      {/* Table */}
      {publishers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <UsersIcon className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">
            {total === 0 ? t('empty.noPublishers') : t('empty.noResults')}
          </p>
          {total === 0 && (
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t('empty.noPublishersDescription')}
            </p>
          )}
          {total === 0 && (
            <Button onClick={handleCreate} className="mt-4">
              <PlusIcon className="size-4" data-icon="inline-start" />
              {t('actions.create')}
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.name')}
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.gender')}
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.role')}
                </TableHead>
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.status')}
                </TableHead>
                <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.vmcEnabled')}
                </TableHead>
                <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.prayerEnabled')}
                </TableHead>
                <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.readerEnabled')}
                </TableHead>
                <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.attendantEnabled')}
                </TableHead>
                <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.microphoneEnabled')}
                </TableHead>
                <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.weekendPresidencyEnabled')}
                </TableHead>
                <TableHead className="h-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('table.watchtowerConductorEnabled')}
                </TableHead>
                <TableHead className="h-10 w-12">
                  <span className="sr-only">{t('table.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publishers.map((publisher, index) => (
                <TableRow
                  key={publisher.id}
                  className={cn(
                    'transition-colors hover:bg-muted/50',
                    isPending && 'opacity-60',
                    index % 2 === 0 && 'bg-muted/30'
                  )}
                >
                  <TableCell className="py-2.5">
                    <Link
                      href={`/publishers/${publisher.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {publisher.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="secondary" className="text-xs">
                      {t(`gender.${publisher.sexo}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-sm text-muted-foreground">
                      {t(`role.${publisher.rol}`)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <PublisherStatusBadge status={publisher.estado} />
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {publisher.habilitadoVMC ? (
                      <CheckCircleIcon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {publisher.habilitadoOracion ? (
                      <CheckCircleIcon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {publisher.habilitadoLectura ? (
                      <CheckCircleIcon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {publisher.habilitadoAcomodador ? (
                      <CheckCircleIcon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {publisher.habilitadoMicrofono ? (
                      <CheckCircleIcon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {publisher.habilitadoPresidenciaFinDeSemana ? (
                      <CheckCircleIcon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {publisher.habilitadoConductorAtalaya ? (
                      <CheckCircleIcon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5">
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
        </div>
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
